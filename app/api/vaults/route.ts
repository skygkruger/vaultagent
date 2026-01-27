import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUserProfile, TIER_LIMITS } from '@/lib/supabase-server'

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
    return NextResponse.json({ error: error.message }, { status: 500 })
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

  const tierLimits = TIER_LIMITS[profile.tier as keyof typeof TIER_LIMITS]
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the action
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'VAULT_CREATE',
    target: name,
  })

  return NextResponse.json({ vault: data }, { status: 201 })
}
