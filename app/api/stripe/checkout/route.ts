import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getUserProfile } from '@/lib/supabase-server'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - STRIPE CHECKOUT API
//  Create checkout sessions for subscription upgrades
// ═══════════════════════════════════════════════════════════════

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

// Price IDs - loaded from environment variables at runtime
function getPriceIds(): Record<string, Record<string, string | undefined>> {
  return {
    pro: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PRO_ANNUAL || process.env.STRIPE_PRICE_PRO_YEARLY,
    },
    team: {
      monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY,
      yearly: process.env.STRIPE_PRICE_TEAM_ANNUAL || process.env.STRIPE_PRICE_TEAM_YEARLY,
    },
    enterprise: {
      monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
      yearly: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
    },
  }
}

export async function POST(request: NextRequest) {
  // Validate required env vars
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error('CRITICAL: NEXT_PUBLIC_APP_URL not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const userProfile = await getUserProfile()
  if (!userProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { user, profile } = userProfile
  const body = await request.json()
  const { plan, billing } = body // plan: 'pro' | 'team' | 'enterprise', billing: 'monthly' | 'yearly'

  if (!plan || !billing) {
    return NextResponse.json(
      { error: 'Missing required fields: plan, billing' },
      { status: 400 }
    )
  }

  const PRICE_IDS = getPriceIds()
  const priceId = PRICE_IDS[plan]?.[billing]

  // Validate price ID exists and is a real Stripe price
  if (!priceId) {
    console.error(`Price ID not configured for plan: ${plan}, billing: ${billing}`)
    return NextResponse.json(
      { error: `Pricing not configured for ${plan} ${billing}. Contact support.` },
      { status: 500 }
    )
  }

  if (!priceId.startsWith('price_')) {
    console.error('Invalid price ID format for plan:', plan)
    return NextResponse.json(
      { error: 'Invalid price configuration. Contact support.' },
      { status: 500 }
    )
  }

  try {

    // Create or get Stripe customer
    let customerId = profile.stripe_customer_id

    if (!customerId) {
      // First check if customer already exists by email
      const existingCustomers = await stripe.customers.list({
        email: user.email!,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email: user.email!,
          metadata: {
            supabase_user_id: user.id,
          },
        })
        customerId = customer.id
      }

      // Immediately link customer ID to profile (don't wait for webhook)
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        const { error: linkError } = await supabaseAdmin
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)

        if (linkError) {
          console.error('Error linking customer ID:', linkError.message)
        }
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=canceled`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    )
  }
}
