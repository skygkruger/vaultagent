import { NextResponse, type NextRequest } from 'next/server'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - MIDDLEWARE
//  Handles session refresh and protected route authentication
// ═══════════════════════════════════════════════════════════════

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/account', '/api/vaults', '/api/secrets', '/api/sessions', '/api/audit', '/api/account']

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/auth/sign-in', '/auth/sign-up']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // Skip middleware if Supabase env vars aren't configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return response
    }

    // Dynamic import to avoid Edge Runtime initialization issues
    const { createServerClient } = await import('@supabase/ssr')

    let supabaseResponse = response

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
            )
          },
        },
      }
    )

    // Refresh session if expired
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Check if accessing protected route without auth
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    if (isProtectedRoute && !user) {
      const redirectUrl = new URL('/auth/sign-in', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect authenticated users away from auth pages
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return supabaseResponse
  } catch (error) {
    // Log error but still allow request (don't block site on auth errors)
    // Protected routes will still be protected by individual page/API checks
    console.error('Middleware auth error (non-blocking):', error)
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/stripe/webhook (Stripe webhooks need raw body)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/stripe/webhook|api/agent).*)',
  ],
}
