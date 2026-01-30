import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUserProfile, TIER_LIMITS } from '@/lib/supabase-server'
import { rateLimitAsync } from '@/lib/rate-limit'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - AUDIT LOG API
//  Retrieve audit logs with tier-based retention
// ═══════════════════════════════════════════════════════════════

// GET /api/audit - List audit logs
export async function GET(request: NextRequest) {
  const userProfile = await getUserProfile()
  if (!userProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { user, profile } = userProfile

  // Rate limit: 30 reads per minute per user
  const { limited } = await rateLimitAsync(`audit:read:${user.id}`, 30, 60_000)
  if (limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const { searchParams } = new URL(request.url)

  // Validate and sanitize query params
  const rawLimit = parseInt(searchParams.get('limit') || '50', 10)
  const rawOffset = parseInt(searchParams.get('offset') || '0', 10)
  const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 50 : rawLimit), 1000)
  const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset)
  const action = searchParams.get('action')
  const agent = searchParams.get('agent')

  const supabase = await createClient()

  // Calculate retention date based on tier
  const tierLimits = TIER_LIMITS[profile.tier as keyof typeof TIER_LIMITS]
  let retentionDate: Date | null = null

  if (tierLimits.audit_retention_days !== -1) {
    retentionDate = new Date()
    retentionDate.setDate(retentionDate.getDate() - tierLimits.audit_retention_days)
  }

  // Build query
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Apply retention filter
  if (retentionDate) {
    query = query.gte('created_at', retentionDate.toISOString())
  }

  // Apply filters
  if (action) {
    query = query.eq('action', action)
  }
  if (agent) {
    query = query.eq('agent_name', agent)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[Audit] Query error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }

  return NextResponse.json({
    logs: data,
    total: count,
    limit,
    offset,
    retention_days: tierLimits.audit_retention_days,
  })
}

// POST /api/audit - Export audit logs (Pro+ only)
export async function POST(request: NextRequest) {
  const userProfile = await getUserProfile()
  if (!userProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { user, profile } = userProfile

  // Rate limit: 5 exports per minute per user
  const { limited } = await rateLimitAsync(`audit:export:${user.id}`, 5, 60_000)
  if (limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const tierLimits = TIER_LIMITS[profile.tier as keyof typeof TIER_LIMITS]

  // Check if export is allowed
  if (!tierLimits.can_export_audit) {
    return NextResponse.json(
      {
        error: 'Audit export is not available on your plan. Upgrade to Pro or higher.',
        code: 'FEATURE_UNAVAILABLE',
      },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { format = 'json', start_date, end_date } = body

  const supabase = await createClient()

  // Build query
  let query = supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Apply date filters
  if (start_date) {
    query = query.gte('created_at', start_date)
  }
  if (end_date) {
    query = query.lte('created_at', end_date)
  }

  // Apply retention filter
  if (tierLimits.audit_retention_days !== -1) {
    const retentionDate = new Date()
    retentionDate.setDate(retentionDate.getDate() - tierLimits.audit_retention_days)
    query = query.gte('created_at', retentionDate.toISOString())
  }

  const { data, error } = await query

  if (error) {
    console.error('[Audit] Export error:', error.message)
    return NextResponse.json({ error: 'Failed to export audit logs' }, { status: 500 })
  }

  if (format === 'csv') {
    // Convert to CSV
    const headers = ['id', 'action', 'target', 'agent_name', 'created_at', 'ip_address']
    const csvRows = [
      headers.join(','),
      ...(data || []).map((log) =>
        headers.map((h) => JSON.stringify(log[h as keyof typeof log] || '')).join(',')
      ),
    ]
    const csv = csvRows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="vaultagent-audit-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  }

  // Default to JSON
  return NextResponse.json({ logs: data })
}
