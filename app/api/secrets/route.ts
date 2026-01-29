import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUserProfile, TIER_LIMITS } from '@/lib/supabase-server'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - SECRETS API
//  CRUD operations for secrets with tier enforcement
// ═══════════════════════════════════════════════════════════════

// GET /api/secrets - List all secrets (optionally filtered by vault)
export async function GET(request: NextRequest) {
  const userProfile = await getUserProfile()
  if (!userProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const vaultId = searchParams.get('vault_id')

  const supabase = await createClient()
  let query = supabase
    .from('secrets')
    .select('id, vault_id, name, created_at, updated_at, last_accessed_at')
    .eq('user_id', userProfile.user.id)
    .order('created_at', { ascending: false })

  if (vaultId) {
    query = query.eq('vault_id', vaultId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Don't return encrypted values in list view
  return NextResponse.json({ secrets: data })
}

// POST /api/secrets - Create a new secret
export async function POST(request: NextRequest) {
  const userProfile = await getUserProfile()
  if (!userProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { user, profile } = userProfile
  const body = await request.json()
  const { vault_id, name, encrypted_value, iv, salt } = body

  if (!vault_id || !name || !encrypted_value || !iv || !salt) {
    return NextResponse.json(
      { error: 'Missing required fields: vault_id, name, encrypted_value, iv, salt' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Verify vault belongs to user
  const { data: vault } = await supabase
    .from('vaults')
    .select('id')
    .eq('id', vault_id)
    .eq('user_id', user.id)
    .single()

  if (!vault) {
    return NextResponse.json({ error: 'Vault not found' }, { status: 404 })
  }

  // Check secret limit
  const { count } = await supabase
    .from('secrets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const tierLimits = TIER_LIMITS[profile.tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free
  if (tierLimits.secret_limit !== -1 && (count || 0) >= tierLimits.secret_limit) {
    return NextResponse.json(
      {
        error: `Secret limit reached (${tierLimits.secret_limit}). Upgrade your plan to store more secrets.`,
        code: 'LIMIT_REACHED',
      },
      { status: 403 }
    )
  }

  // Create secret with timeout
  const insertPromise = supabase
    .from('secrets')
    .insert({
      vault_id,
      user_id: user.id,
      name: name.toUpperCase().replace(/\s+/g, '_'),
      encrypted_value,
      iv,
      salt,
    })
    .select('id, vault_id, name, created_at')
    .single()

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Database operation timed out')), 15000)
  )

  const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as Awaited<typeof insertPromise>

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A secret with this name already exists in this vault' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the action
  const { error: auditError } = await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'SECRET_CREATE',
    target: data.name,
  })

  if (auditError) {
    console.error('Audit log failed:', auditError)
  }

  return NextResponse.json({ secret: data }, { status: 201 })
}
