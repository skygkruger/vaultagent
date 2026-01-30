import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getUserProfile, TIER_LIMITS } from '@/lib/supabase-server'
import { rateLimitAsync } from '@/lib/rate-limit'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - STRIPE SYNC
//  Syncs subscription status directly from Stripe
//  Called when user returns from checkout or on dashboard load
// ═══════════════════════════════════════════════════════════════

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

// Price ID to tier mapping
function getPriceToTier(): Record<string, keyof typeof TIER_LIMITS> {
  const entries: [string | undefined, keyof typeof TIER_LIMITS][] = [
    [process.env.STRIPE_PRICE_PRO_MONTHLY, 'pro'],
    [process.env.STRIPE_PRICE_TEAM_MONTHLY, 'team'],
    [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY, 'enterprise'],
    [process.env.STRIPE_PRICE_PRO_ANNUAL, 'pro'],
    [process.env.STRIPE_PRICE_TEAM_ANNUAL, 'team'],
    [process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL, 'enterprise'],
    [process.env.STRIPE_PRICE_PRO_YEARLY, 'pro'],
    [process.env.STRIPE_PRICE_TEAM_YEARLY, 'team'],
    [process.env.STRIPE_PRICE_ENTERPRISE_YEARLY, 'enterprise'],
  ]
  const result: Record<string, keyof typeof TIER_LIMITS> = {}
  for (const [priceId, tier] of entries) {
    if (priceId) result[priceId] = tier
  }
  return result
}

export async function POST() {
  try {
    // Validate required env vars
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables for sync')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Get current user
    const userProfile = await getUserProfile()
    if (!userProfile) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { user, profile } = userProfile

    // Rate limit: 10 syncs per minute per user
    const { limited } = await rateLimitAsync(`sync:${user.id}`, 10, 60_000)
    if (limited) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
    }

    // If user has a Stripe customer ID, check their subscription
    let customerId = profile.stripe_customer_id

    // If no customer ID, search for customer by email
    if (!customerId && user.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      }
    }

    if (!customerId) {
      return NextResponse.json({
        synced: false,
        message: 'No Stripe customer found for this account',
        tier: profile.tier
      })
    }

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    // Also check for trialing subscriptions
    const trialingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'trialing',
      limit: 1,
    })

    const allSubs = [...subscriptions.data, ...trialingSubscriptions.data]

    if (allSubs.length === 0) {
      // No active subscription - downgrade to free if they had a paid tier
      if (profile.tier !== 'free') {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const limits = TIER_LIMITS['free']
        await supabaseAdmin
          .from('profiles')
          .update({
            stripe_customer_id: customerId,
            tier: 'free',
            vault_limit: limits.vault_limit,
            secret_limit: limits.secret_limit,
            session_limit: limits.session_limit,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      }
      return NextResponse.json({
        synced: true,
        message: 'No active subscription',
        tier: 'free'
      })
    }

    // Get the subscription and determine tier
    const subscription = allSubs[0]
    const priceId = subscription.items.data[0]?.price.id
    const PRICE_TO_TIER = getPriceToTier()
    const tier = PRICE_TO_TIER[priceId]

    if (!tier) {
      console.error('Unknown price ID during sync:', priceId)
      return NextResponse.json({
        error: 'Unknown subscription price. Please contact support.',
        synced: false
      }, { status: 400 })
    }

    const limits = TIER_LIMITS[tier]

    // Update profile with Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        stripe_customer_id: customerId,
        tier,
        vault_limit: limits.vault_limit,
        secret_limit: limits.secret_limit,
        session_limit: limits.session_limit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Sync profile update failed:', updateError.message)
      return NextResponse.json({
        error: 'Failed to update profile'
      }, { status: 500 })
    }

    return NextResponse.json({
      synced: true,
      tier,
      message: `Synced to ${tier} tier`
    })
  } catch (err) {
    console.error('Stripe sync error:', err instanceof Error ? err.message : err)
    return NextResponse.json({
      error: 'Sync failed. Please try again or contact support.'
    }, { status: 500 })
  }
}
