import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getUserProfile } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - ACCOUNT DELETION API
//  Permanently deletes user account and all associated data
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  // Validate required env vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const userProfile = await getUserProfile()
  if (!userProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { user, profile } = userProfile

  // Rate limit: 3 delete attempts per minute per user
  const { limited } = rateLimit(`delete:${user.id}`, 3, 60_000)
  if (limited) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  const body = await request.json()
  const { confirmEmail } = body

  // Require email confirmation to prevent accidental deletion
  if (!confirmEmail || confirmEmail !== user.email) {
    return NextResponse.json(
      { error: 'Email confirmation does not match. Please type your email exactly.' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. Cancel Stripe subscription if user has one
    if (profile.stripe_customer_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2025-12-15.clover',
        })
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'active',
        })
        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id)
        }
        // Also cancel trialing
        const trialingSubs = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'trialing',
        })
        for (const sub of trialingSubs.data) {
          await stripe.subscriptions.cancel(sub.id)
        }
      } catch (stripeErr) {
        console.error('Error canceling Stripe subscriptions:', stripeErr)
        // Continue with deletion even if Stripe cancel fails
      }
    }

    // 2. Delete all user data (order matters due to foreign keys)
    // Audit logs first (references sessions)
    await supabaseAdmin
      .from('audit_logs')
      .delete()
      .eq('user_id', user.id)

    // Sessions (references vaults)
    await supabaseAdmin
      .from('sessions')
      .delete()
      .eq('user_id', user.id)

    // Secrets (references vaults)
    await supabaseAdmin
      .from('secrets')
      .delete()
      .eq('user_id', user.id)

    // Vaults
    await supabaseAdmin
      .from('vaults')
      .delete()
      .eq('user_id', user.id)

    // Profile
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id)

    // 3. Delete the auth user
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
      return NextResponse.json(
        { error: 'Data deleted but failed to remove auth account. Contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ deleted: true })
  } catch (err) {
    console.error('Account deletion error:', err)
    return NextResponse.json(
      { error: 'Failed to delete account. Please contact support.' },
      { status: 500 }
    )
  }
}
