import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rate-limit'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - AGENT SECRETS API
//  Public endpoint for AI agents to retrieve encrypted secrets
//  using a scoped session token. Server returns encrypted blobs
//  only — decryption happens client-side (CLI) to preserve
//  zero-knowledge guarantee.
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  // Extract bearer token
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing Authorization header. Use: Authorization: Bearer va_sess_xxx' },
      { status: 401 }
    )
  }

  const token = authHeader.slice(7).trim()
  if (!token || !token.startsWith('va_sess_')) {
    return NextResponse.json(
      { error: 'Invalid token format' },
      { status: 401 }
    )
  }

  // Rate limit: 30 requests per minute per token
  const { limited } = rateLimit(`agent:${token}`, 30, 60_000)
  if (limited) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 30 requests per minute per session.' },
      { status: 429 }
    )
  }

  // Validate env vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  // Use admin client to bypass RLS (agent has no Supabase session)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Hash the token for lookup (plaintext tokens are never stored)
    const tokenHash = createHash('sha256').update(token).digest('hex')

    // Look up session by token hash
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('id, user_id, vault_id, agent_name, allowed_secrets, expires_at, revoked_at')
      .eq('token_hash', tokenHash)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 })
    }

    // Check if revoked
    if (session.revoked_at) {
      return NextResponse.json({ error: 'Session has been revoked' }, { status: 401 })
    }

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session has expired' }, { status: 401 })
    }

    // Fetch encrypted secrets for allowed secret names
    const { data: secrets, error: secretsError } = await supabaseAdmin
      .from('secrets')
      .select('name, encrypted_value, iv, salt')
      .eq('vault_id', session.vault_id)
      .eq('user_id', session.user_id)
      .in('name', session.allowed_secrets)

    if (secretsError) {
      return NextResponse.json({ error: 'Failed to retrieve secrets' }, { status: 500 })
    }

    // Extract IP and user agent for audit logging
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || null
    const userAgent = request.headers.get('user-agent') || null

    // Log audit entry for each secret accessed
    const auditEntries = (secrets || []).map(secret => ({
      user_id: session.user_id,
      session_id: session.id,
      action: 'SECRET_ACCESS' as const,
      target: secret.name,
      agent_name: session.agent_name,
      ip_address: ip,
      user_agent: userAgent,
      metadata: { source: 'agent_api' },
    }))

    if (auditEntries.length > 0) {
      await supabaseAdmin.from('audit_logs').insert(auditEntries)
    }

    // Update last_accessed_at for all accessed secrets in one query
    if (secrets && secrets.length > 0) {
      const secretNames = secrets.map(s => s.name)
      await supabaseAdmin
        .from('secrets')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('vault_id', session.vault_id)
        .eq('user_id', session.user_id)
        .in('name', secretNames)
    }

    return NextResponse.json({
      secrets: (secrets || []).map(s => ({
        name: s.name,
        encrypted_value: s.encrypted_value,
        iv: s.iv,
        salt: s.salt,
      })),
      session: {
        agent_name: session.agent_name,
        expires_at: session.expires_at,
        allowed_secrets: session.allowed_secrets,
      },
    })
  } catch (err) {
    console.error('Agent secrets endpoint error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
