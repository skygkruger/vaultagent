import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUserProfile, TIER_LIMITS } from '@/lib/supabase-server'
import { rateLimitAsync } from '@/lib/rate-limit'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - VAULTS API
//  CRUD operations for vaults with tier enforcement
// ═══════════════════════════════════════════════════════════════

// GET /api/vaults - List all vaults for the user
export async function GET() {
  const userProfile = await getUserProfile()
  if (!userProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 60 reads per minute per user
  const { limited } = await rateLimitAsync(`vaults:read:${userProfile.user.id}`, 60, 60_000)
  if (limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vaults')
    .select(`
      *,
      secrets:secrets(count)
    `)
    .eq('user_id', userProfile.user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[Vaults] Query error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch vaults' }, { status: 500 })
  }

  return NextResponse.json({ vaults: data })
}

// POST /api/vaults - Create a new vault
export async function POST(request: NextRequest) {
  const userProfile = await getUserProfile()
  if (!userProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { user, profile } = userProfile

  // Rate limit: 10 creates per minute per user
  const { limited } = await rateLimitAsync(`vaults:create:${user.id}`, 10, 60_000)
  if (limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await request.json()
  const { name, description } = body

  if (!name) {
    return NextResponse.json({ error: 'Vault name is required' }, { status: 400 })
  }

  // Check vault limit
  const supabase = await createClient()
  const { count } = await supabase
    .from('vaults')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const tierLimits = TIER_LIMITS[profile.tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free
  if (tierLimits.vault_limit !== -1 && (count || 0) >= tierLimits.vault_limit) {
    return NextResponse.json(
      {
        error: `Vault limit reached (${tierLimits.vault_limit}). Upgrade your plan to create more vaults.`,
        code: 'LIMIT_REACHED',
      },
      { status: 403 }
    )
  }

  // Create vault
  const { data, error } = await supabase
    .from('vaults')
    .insert({
      user_id: user.id,
      name,
      description,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A vault with this name already exists' }, { status: 409 })
    }
    console.error('[Vaults] Create error:', error.message)
    return NextResponse.json({ error: 'Failed to create vault' }, { status: 500 })
  }

  // Log the action
  const { error: auditError } = await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'VAULT_CREATE',
    target: name,
  })

  if (auditError) {
    console.error('Audit log failed:', auditError)
  }

  return NextResponse.json({ vault: data }, { status: 201 })
}
