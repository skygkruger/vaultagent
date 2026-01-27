import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUserProfile } from '@/lib/supabase-server'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - SECRET DETAIL API
//  Get, update, delete individual secrets
// ═══════════════════════════════════════════════════════════════

// GET /api/secrets/[id] - Get secret (including encrypted value for decryption)
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
    .from('secrets')
    .select('*')
    .eq('id', id)
    .eq('user_id', userProfile.user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Secret not found' }, { status: 404 })
  }

  // Update last accessed timestamp
  await supabase
    .from('secrets')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', id)

  // Log the access
  const { error: auditError } = await supabase.from('audit_logs').insert({
    user_id: userProfile.user.id,
    action: 'SECRET_ACCESS',
    target: data.name,
  })

  if (auditError) {
    console.error('Audit log failed:', auditError)
  }

  return NextResponse.json({ secret: data })
}

// PATCH /api/secrets/[id] - Update secret
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
  const { name, encrypted_value, iv, salt } = body

  const supabase = await createClient()

  // Build update object
  const updates: Record<string, string> = {
    updated_at: new Date().toISOString(),
  }

  if (name) updates.name = name.toUpperCase().replace(/\s+/g, '_')
  if (encrypted_value) updates.encrypted_value = encrypted_value
  if (iv) updates.iv = iv
  if (salt) updates.salt = salt

  const { data, error } = await supabase
    .from('secrets')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userProfile.user.id)
    .select('id, vault_id, name, created_at, updated_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Secret not found' }, { status: 404 })
  }

  // Log the action
  const { error: auditError } = await supabase.from('audit_logs').insert({
    user_id: userProfile.user.id,
    action: 'SECRET_UPDATE',
    target: data.name,
  })

  if (auditError) {
    console.error('Audit log failed:', auditError)
  }

  return NextResponse.json({ secret: data })
}

// DELETE /api/secrets/[id] - Delete secret
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

  // Get secret name for audit log
  const { data: secret } = await supabase
    .from('secrets')
    .select('name')
    .eq('id', id)
    .eq('user_id', userProfile.user.id)
    .single()

  if (!secret) {
    return NextResponse.json({ error: 'Secret not found' }, { status: 404 })
  }

  // Delete secret
  const { error } = await supabase
    .from('secrets')
    .delete()
    .eq('id', id)
    .eq('user_id', userProfile.user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the action
  const { error: auditError } = await supabase.from('audit_logs').insert({
    user_id: userProfile.user.id,
    action: 'SECRET_DELETE',
    target: secret.name,
  })

  if (auditError) {
    console.error('Audit log failed:', auditError)
  }

  return NextResponse.json({ success: true })
}
