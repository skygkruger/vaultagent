import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUserProfile } from '@/lib/supabase-server'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - SESSION DETAIL API
//  Get and revoke individual sessions
// ═══════════════════════════════════════════════════════════════

// GET /api/sessions/[id] - Get session details
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
    .from('sessions')
    .select(`
      *,
      vaults:vault_id(name)
    `)
    .eq('id', id)
    .eq('user_id', userProfile.user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Calculate status
  const status = data.revoked_at
    ? 'revoked'
    : new Date(data.expires_at) < new Date()
      ? 'expired'
      : 'active'

  return NextResponse.json({
    session: {
      ...data,
      status,
    },
  })
}

// DELETE /api/sessions/[id] - Revoke session
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

  // Get session details for logging
  const { data: session } = await supabase
    .from('sessions')
    .select('agent_name, vault_id, vaults:vault_id(name)')
    .eq('id', id)
    .eq('user_id', userProfile.user.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Revoke session
  const { error } = await supabase
    .from('sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userProfile.user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the action
  const vaultName = session.vaults && typeof session.vaults === 'object' && 'name' in session.vaults
    ? (session.vaults as { name: string }).name
    : 'unknown'
  await supabase.from('audit_logs').insert({
    user_id: userProfile.user.id,
    session_id: id,
    action: 'SESSION_REVOKE',
    target: vaultName,
    agent_name: session.agent_name,
  })

  return NextResponse.json({ success: true })
}
