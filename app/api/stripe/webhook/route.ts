import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { TIER_LIMITS } from '@/lib/supabase-server'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - STRIPE WEBHOOK
//  Handle subscription events and update user tiers
// ═══════════════════════════════════════════════════════════════

// Lazy initialization to avoid build-time errors
let stripe: Stripe | null = null
let supabaseAdmin: ReturnType<typeof createClient> | null = null

function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    })
  }
  return stripe
}

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseAdmin
}

// Map Stripe price IDs to tiers (loaded at runtime)
function getPriceToTier(): Record<string, keyof typeof TIER_LIMITS> {
  const entries: [string | undefined, keyof typeof TIER_LIMITS][] = [
    // Individual VaultAgent plans
    [process.env.STRIPE_PRICE_PRO_MONTHLY, 'pro'],
    [process.env.STRIPE_PRICE_TEAM_MONTHLY, 'team'],
    [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY, 'enterprise'],
    [process.env.STRIPE_PRICE_PRO_ANNUAL, 'pro'],
    [process.env.STRIPE_PRICE_TEAM_ANNUAL, 'team'],
    [process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL, 'enterprise'],
    [process.env.STRIPE_PRICE_PRO_YEARLY, 'pro'],
    [process.env.STRIPE_PRICE_TEAM_YEARLY, 'team'],
    [process.env.STRIPE_PRICE_ENTERPRISE_YEARLY, 'enterprise'],
    // AI Security Stack Bundle (VaultAgent + AgentLeash)
    [process.env.STRIPE_PRICE_BUNDLE_PRO_MONTHLY, 'pro'],
    [process.env.STRIPE_PRICE_BUNDLE_PRO_ANNUAL, 'pro'],
    [process.env.STRIPE_PRICE_BUNDLE_PRO_YEARLY, 'pro'],
    [process.env.STRIPE_PRICE_BUNDLE_TEAM_MONTHLY, 'team'],
    [process.env.STRIPE_PRICE_BUNDLE_TEAM_ANNUAL, 'team'],
    [process.env.STRIPE_PRICE_BUNDLE_TEAM_YEARLY, 'team'],
    [process.env.STRIPE_PRICE_BUNDLE_ENTERPRISE_MONTHLY, 'enterprise'],
    [process.env.STRIPE_PRICE_BUNDLE_ENTERPRISE_ANNUAL, 'enterprise'],
    [process.env.STRIPE_PRICE_BUNDLE_ENTERPRISE_YEARLY, 'enterprise'],
  ]
  const result: Record<string, keyof typeof TIER_LIMITS> = {}
  for (const [priceId, tier] of entries) {
    if (priceId) result[priceId] = tier
  }
  return result
}

async function updateUserTier(
  customerId: string,
  tier: keyof typeof TIER_LIMITS
) {
  const limits = TIER_LIMITS[tier]
  const supabase = getSupabaseAdmin() as any

  const { data: profile, error } = await supabase
    .from('profiles')
    .update({
      tier,
      vault_limit: limits.vault_limit,
      secret_limit: limits.secret_limit,
      session_limit: limits.session_limit,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user tier:', error.message)
    throw error
  }

  return profile
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0]?.price.id
  const PRICE_TO_TIER = getPriceToTier()

  const tier = PRICE_TO_TIER[priceId]
  if (!tier) {
    console.error('Unknown price ID in subscription.created:', priceId)
    throw new Error(`Unknown price ID: ${priceId}`)
  }

  await updateUserTier(customerId, tier)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0]?.price.id
  const PRICE_TO_TIER = getPriceToTier()

  if (subscription.status === 'active' || subscription.status === 'trialing') {
    const tier = PRICE_TO_TIER[priceId]
    if (!tier) {
      console.error('Unknown price ID in subscription.updated:', priceId)
      throw new Error(`Unknown price ID: ${priceId}`)
    }
    await updateUserTier(customerId, tier)
  } else if (
    subscription.status === 'canceled' ||
    subscription.status === 'unpaid' ||
    subscription.status === 'past_due'
  ) {
    await updateUserTier(customerId, 'free')
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  await updateUserTier(customerId, 'free')
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string
  const userId = session.client_reference_id
  const subscriptionId = session.subscription as string
  const supabase = getSupabaseAdmin() as any
  const PRICE_TO_TIER = getPriceToTier()

  if (!userId) {
    console.error('Missing client_reference_id in checkout session')
    throw new Error('Missing client_reference_id in checkout session')
  }

  if (!customerId) {
    console.error('Missing customer in checkout session')
    throw new Error('Missing customer in checkout session')
  }

  if (!subscriptionId) {
    console.error('Missing subscription in checkout session')
    throw new Error('Missing subscription in checkout session')
  }

  // Get subscription details to determine tier
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0]?.price.id

  const tier = PRICE_TO_TIER[priceId]
  if (!tier) {
    console.error('Unknown price ID in checkout:', priceId)
    // Still link the customer ID so we can fix manually
    await supabase
      .from('profiles')
      .update({
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    throw new Error(`Unknown price ID: ${priceId}. Customer linked but tier not set.`)
  }

  const limits = TIER_LIMITS[tier]

  // SINGLE ATOMIC UPDATE: Link customer ID AND update tier together
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      tier,
      vault_limit: limits.vault_limit,
      secret_limit: limits.secret_limit,
      session_limit: limits.session_limit,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) {
    console.error('Checkout profile update failed:', updateError.message)
    throw new Error(`Failed to update profile: ${updateError.message}`)
  }
}

export async function POST(request: NextRequest) {
  // Validate required env vars upfront
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not configured')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase env vars not configured')
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
    }
  } catch (err) {
    console.error('Webhook handler failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
