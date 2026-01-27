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
      apiVersion: '2025-12-15.clover',
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
  return {
    // Monthly prices
    [process.env.STRIPE_PRICE_PRO_MONTHLY || '']: 'pro',
    [process.env.STRIPE_PRICE_TEAM_MONTHLY || '']: 'team',
    [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '']: 'enterprise',
    // Annual prices
    [process.env.STRIPE_PRICE_PRO_YEARLY || '']: 'pro',
    [process.env.STRIPE_PRICE_TEAM_YEARLY || '']: 'team',
    [process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || '']: 'enterprise',
  }
}

async function updateUserTier(
  customerId: string,
  tier: keyof typeof TIER_LIMITS
) {
  const limits = TIER_LIMITS[tier]
  const supabase = getSupabaseAdmin() as any

  // Find user by Stripe customer ID
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
    console.error('Error updating user tier:', error)
    throw error
  }

  return profile
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0]?.price.id
  const PRICE_TO_TIER = getPriceToTier()

  const tier = PRICE_TO_TIER[priceId] || 'free'
  await updateUserTier(customerId, tier)

  console.log(`Subscription created: ${customerId} -> ${tier}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0]?.price.id
  const PRICE_TO_TIER = getPriceToTier()

  // Check if subscription is still active
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    const tier = PRICE_TO_TIER[priceId] || 'free'
    await updateUserTier(customerId, tier)
    console.log(`Subscription updated: ${customerId} -> ${tier}`)
  } else if (
    subscription.status === 'canceled' ||
    subscription.status === 'unpaid' ||
    subscription.status === 'past_due'
  ) {
    // Downgrade to free
    await updateUserTier(customerId, 'free')
    console.log(`Subscription canceled/unpaid: ${customerId} -> free`)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Downgrade to free tier
  await updateUserTier(customerId, 'free')
  console.log(`Subscription deleted: ${customerId} -> free`)
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string
  const userId = session.client_reference_id
  const subscriptionId = session.subscription as string
  const supabase = getSupabaseAdmin() as any
  const PRICE_TO_TIER = getPriceToTier()

  if (userId && customerId) {
    // Link Stripe customer to user profile
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId)

    console.log(`Linked Stripe customer ${customerId} to user ${userId}`)

    // Also update the tier immediately from the subscription
    if (subscriptionId) {
      try {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id
        const tier = PRICE_TO_TIER[priceId] || 'pro' // Default to pro if price not found
        const limits = TIER_LIMITS[tier]

        await supabase
          .from('profiles')
          .update({
            tier,
            vault_limit: limits.vault_limit,
            secret_limit: limits.secret_limit,
            session_limit: limits.session_limit,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        console.log(`Checkout completed: Updated user ${userId} to tier ${tier}`)
      } catch (err) {
        console.error('Error updating tier on checkout:', err)
      }
    }
  }
}

export async function POST(request: NextRequest) {
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
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
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

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error('Error processing webhook:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
