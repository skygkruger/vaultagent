import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getUserProfile } from '@/lib/supabase-server'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - STRIPE CHECKOUT API
//  Create checkout sessions for subscription upgrades
// ═══════════════════════════════════════════════════════════════

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

// Price IDs - Update these with your actual Stripe price IDs
const PRICE_IDS: Record<string, Record<string, string>> = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  },
  team: {
    monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY || 'price_team_monthly',
    yearly: process.env.STRIPE_PRICE_TEAM_YEARLY || 'price_team_yearly',
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
    yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
  },
}

export async function POST(request: NextRequest) {
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

  const priceId = PRICE_IDS[plan]?.[billing]
  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan or billing period' }, { status: 400 })
  }

  try {
    // Validate price ID is a real Stripe price (not a placeholder)
    if (priceId.startsWith('price_') && !priceId.startsWith('price_1')) {
      console.error('Invalid price ID - appears to be placeholder:', priceId)
      return NextResponse.json(
        { error: `Price ID not configured for ${plan} ${billing}. Check Vercel environment variables.` },
        { status: 500 }
      )
    }

    // Create or get Stripe customer
    let customerId = profile.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?checkout=canceled`,
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          supabase_user_id: user.id,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errorMessage}` },
      { status: 500 }
    )
  }
}
