import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - AUTH CALLBACK
//  Handles email confirmation redirects from Supabase
// ═══════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription)
    const signInUrl = new URL('/auth/sign-in', requestUrl.origin)
    signInUrl.searchParams.set('error', errorDescription || 'Authentication failed')
    return NextResponse.redirect(signInUrl)
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('[Auth Callback] Code exchange error:', exchangeError.message)
        const signInUrl = new URL('/auth/sign-in', requestUrl.origin)
        signInUrl.searchParams.set('error', 'Session expired. Please sign in again.')
        return NextResponse.redirect(signInUrl)
      }
    } catch (err) {
      console.error('[Auth Callback] Unexpected error:', err)
      const signInUrl = new URL('/auth/sign-in', requestUrl.origin)
      signInUrl.searchParams.set('error', 'Authentication failed. Please try again.')
      return NextResponse.redirect(signInUrl)
    }
  }

  // Redirect to dashboard after successful auth
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
