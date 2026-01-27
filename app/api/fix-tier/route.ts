import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserProfile, TIER_LIMITS } from '@/lib/supabase-server'

// ═══════════════════════════════════════════════════════════════
//  TEMPORARY: Manual tier fix endpoint
//  DELETE THIS AFTER DEBUGGING
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const userProfile = await getUserProfile()
    if (!userProfile) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { user } = userProfile
    const body = await request.json()
    const tier = body.tier || 'pro'

    // Validate tier
    if (!['free', 'pro', 'team', 'enterprise'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Get admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({
        error: 'Missing env vars',
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceKey
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey)
    const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS]

    // Update tier
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        tier,
        vault_limit: limits.vault_limit,
        secret_limit: limits.secret_limit,
        session_limit: limits.session_limit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Updated to ${tier}`,
      profile: data
    })
  } catch (err) {
    return NextResponse.json({
      error: 'Exception',
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
