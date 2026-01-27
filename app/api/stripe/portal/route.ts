import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getUserProfile } from '@/lib/supabase-server'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - STRIPE CUSTOMER PORTAL API
//  Create portal sessions for subscription management
// ═══════════════════════════════════════════════════════════════

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

export async function POST() {
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

  // Try to get customer ID, or search by email if not linked
  let customerId = profile.stripe_customer_id

  if (!customerId && user.email) {
    console.log('Portal: No customer ID, searching by email:', user.email)
    try {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
        console.log('Portal: Found customer by email:', customerId)

        // Link the customer ID for future use
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          )
          await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', user.id)
          console.log('Portal: Linked customer ID to profile')
        }
      }
    } catch (err) {
      console.error('Error searching for customer:', err)
    }
  }

  if (!customerId) {
    return NextResponse.json(
      { error: 'No Stripe customer found. Please contact support if you have an active subscription.' },
      { status: 400 }
    )
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe portal error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to create portal session: ${errorMessage}` }, { status: 500 })
  }
}
