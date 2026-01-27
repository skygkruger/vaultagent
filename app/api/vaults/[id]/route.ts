import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUserProfile } from '@/lib/supabase-server'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - VAULT DETAIL API
//  Get, update, delete individual vaults
// ═══════════════════════════════════════════════════════════════

// GET /api/vaults/[id] - Get vault details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userProfile = await getUserProfile()
  if (!userProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vaults')
    .select(`
      *,
      secrets:secrets(id, name, created_at, last_accessed_at)
    `)
    .eq('id', id)
    .eq('user_id', userProfile.user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Vault not found' }, { status: 404 })
  }

  return NextResponse.json({ vault: data })
}

// PATCH /api/vaults/[id] - Update vault
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userProfile = await getUserProfile()
  if (!userProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { name, description } = body

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vaults')
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userProfile.user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ vault: data })
}

// DELETE /api/vaults/[id] - Delete vault
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userProfile = await getUserProfile()
  if (!userProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = await createClient()

  // Get vault name for audit log
  const { data: vault } = await supabase
    .from('vaults')
    .select('name')
    .eq('id', id)
    .eq('user_id', userProfile.user.id)
    .single()

  if (!vault) {
    return NextResponse.json({ error: 'Vault not found' }, { status: 404 })
  }

  // Delete vault (cascades to secrets)
  const { error } = await supabase
    .from('vaults')
    .delete()
    .eq('id', id)
    .eq('user_id', userProfile.user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the action
  await supabase.from('audit_logs').insert({
    user_id: userProfile.user.id,
    action: 'VAULT_DELETE',
    target: vault.name,
  })

  return NextResponse.json({ success: true })
}
