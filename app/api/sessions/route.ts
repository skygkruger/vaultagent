import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUserProfile, TIER_LIMITS } from '@/lib/supabase-server'
import { generateSessionToken } from '@/lib/encryption'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - SESSIONS API
//  Create and manage agent sessions with tier enforcement
// ═══════════════════════════════════════════════════════════════

// GET /api/sessions - List all sessions
export async function GET(request: NextRequest) {
  const userProfile = await getUserProfile()
  if (!userProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // 'active', 'expired', 'revoked', 'all'

  const supabase = await createClient()
  let query = supabase
    .from('sessions')
    .select(`
      id,
      vault_id,
      agent_name,
      allowed_secrets,
      expires_at,
      created_at,
      revoked_at,
      vaults:vault_id(name)
    `)
    .eq('user_id', userProfile.user.id)
    .order('created_at', { ascending: false })

  // Filter by status
  if (status === 'active') {
    query = query.is('revoked_at', null).gt('expires_at', new Date().toISOString())
  } else if (status === 'expired') {
    query = query.is('revoked_at', null).lt('expires_at', new Date().toISOString())
  } else if (status === 'revoked') {
    query = query.not('revoked_at', 'is', null)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Calculate session status for each
  const sessions = data?.map((session) => ({
    ...session,
    status: session.revoked_at
      ? 'revoked'
      : new Date(session.expires_at) < new Date()
        ? 'expired'
        : 'active',
  }))

  return NextResponse.json({ sessions })
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  const userProfile = await getUserProfile()
  if (!userProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { user, profile } = userProfile
  const body = await request.json()
  const { vault_id, agent_name, allowed_secrets, duration_hours } = body

  if (!vault_id || !agent_name || !duration_hours) {
    return NextResponse.json(
      { error: 'Missing required fields: vault_id, agent_name, duration_hours' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Verify vault belongs to user
  const { data: vault } = await supabase
    .from('vaults')
    .select('id, name')
    .eq('id', vault_id)
    .eq('user_id', user.id)
    .single()

  if (!vault) {
    return NextResponse.json({ error: 'Vault not found' }, { status: 404 })
  }

  // Check session limit (daily limit for free tier)
  const tierLimits = TIER_LIMITS[profile.tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free
  if (tierLimits.session_limit !== -1) {
    // Count sessions created today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())

    if ((count || 0) >= tierLimits.session_limit) {
      return NextResponse.json(
        {
          error: `Daily session limit reached (${tierLimits.session_limit}). Upgrade your plan for unlimited sessions.`,
          code: 'LIMIT_REACHED',
        },
        { status: 403 }
      )
    }
  }

  // Get allowed secrets or default to all secrets in vault
  let secretNames = allowed_secrets
  if (!secretNames || secretNames.length === 0) {
    const { data: secrets } = await supabase
      .from('secrets')
      .select('name')
      .eq('vault_id', vault_id)
      .eq('user_id', user.id)

    secretNames = secrets?.map((s) => s.name) || []
  }

  // Generate session token and expiry
  const token = generateSessionToken()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + duration_hours)

  // Create session
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      vault_id,
      agent_name,
      allowed_secrets: secretNames,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the action
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    session_id: data.id,
    action: 'SESSION_CREATE',
    target: vault.name,
    agent_name,
    metadata: { duration_hours, secret_count: secretNames.length },
  })

  return NextResponse.json(
    {
      session: {
        id: data.id,
        token: data.token,
        agent_name: data.agent_name,
        vault_name: vault.name,
        allowed_secrets: data.allowed_secrets,
        expires_at: data.expires_at,
        created_at: data.created_at,
      },
    },
    { status: 201 }
  )
}
