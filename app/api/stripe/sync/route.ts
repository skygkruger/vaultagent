import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getUserProfile, TIER_LIMITS } from '@/lib/supabase-server'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - STRIPE SYNC
//  Syncs subscription status directly from Stripe
//  Called when user returns from checkout
// ═══════════════════════════════════════════════════════════════

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

// Price ID to tier mapping
function getPriceToTier(): Record<string, keyof typeof TIER_LIMITS> {
  return {
    [process.env.STRIPE_PRICE_PRO_MONTHLY || '']: 'pro',
    [process.env.STRIPE_PRICE_TEAM_MONTHLY || '']: 'team',
    [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '']: 'enterprise',
    [process.env.STRIPE_PRICE_PRO_ANNUAL || '']: 'pro',
    [process.env.STRIPE_PRICE_TEAM_ANNUAL || '']: 'team',
    [process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || '']: 'enterprise',
  }
}

export async function POST() {
  try {
    // Validate required env vars
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('CRITICAL: Missing Supabase environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Get current user
    const userProfile = await getUserProfile()
    if (!userProfile) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { user, profile } = userProfile
    console.log('Sync request for user:', user.id, 'email:', user.email)

    // If user has a Stripe customer ID, check their subscription
    let customerId = profile.stripe_customer_id
    console.log('Existing stripe_customer_id:', customerId)

    // If no customer ID, search for customer by email
    if (!customerId && user.email) {
      console.log('Searching Stripe for customer by email:', user.email)
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
        console.log('Found Stripe customer by email:', customerId)
      } else {
        console.log('No Stripe customer found for email')
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
    console.log('Fetching subscriptions for customer:', customerId)
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
    console.log('Found subscriptions:', allSubs.length)

    if (allSubs.length === 0) {
      // No active subscription - downgrade to free if they had a paid tier
      if (profile.tier !== 'free') {
        console.log('No active subscription, downgrading to free')
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
    console.log('Subscription price ID:', priceId)

    const PRICE_TO_TIER = getPriceToTier()
    console.log('Price to tier mapping:', JSON.stringify(PRICE_TO_TIER))

    const tier = PRICE_TO_TIER[priceId]
    if (!tier) {
      console.error('CRITICAL: Unknown price ID, cannot determine tier:', priceId)
      console.error('Available mappings:', PRICE_TO_TIER)
      return NextResponse.json({
        error: `Unknown subscription price. Please contact support. Price ID: ${priceId}`,
        synced: false
      }, { status: 400 })
    }

    const limits = TIER_LIMITS[tier]
    console.log(`Syncing user ${user.id} to tier ${tier} with limits:`, limits)

    // Update profile with Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: updateData, error: updateError } = await supabaseAdmin
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
      .select()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      console.error('Update error details:', JSON.stringify(updateError))
      return NextResponse.json({
        error: `Failed to update profile: ${updateError.message || 'Unknown database error'}`
      }, { status: 500 })
    }

    console.log('Profile updated successfully:', updateData)

    return NextResponse.json({
      synced: true,
      tier,
      customerId,
      message: `Synced to ${tier} tier`
    })
  } catch (err) {
    console.error('Stripe sync error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    return NextResponse.json({
      error: `Sync failed: ${errorMessage}`
    }, { status: 500 })
  }
}
