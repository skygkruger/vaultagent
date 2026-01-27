import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - SUPABASE SERVER CLIENT
//  Server-side client for authentication and protected operations
// ═══════════════════════════════════════════════════════════════

// Provide fallback values for build time (won't be used at runtime)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}

// Helper to get current user on server
export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// Helper to get user profile with tier info
export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) return null

  return { user, profile }
}

// Tier limits configuration
export const TIER_LIMITS = {
  free: {
    vault_limit: 1,
    secret_limit: 10,
    session_limit: 50,
    audit_retention_days: 7,
    can_export_audit: false,
    can_share_vaults: false,
    has_api_access: false,
    has_sso: false,
  },
  pro: {
    vault_limit: 5,
    secret_limit: 100,
    session_limit: -1, // unlimited
    audit_retention_days: 30,
    can_export_audit: true,
    can_share_vaults: false,
    has_api_access: true,
    has_sso: false,
  },
  team: {
    vault_limit: 20,
    secret_limit: 500,
    session_limit: -1, // unlimited
    audit_retention_days: 90,
    can_export_audit: true,
    can_share_vaults: true,
    has_api_access: true,
    has_sso: false,
  },
  enterprise: {
    vault_limit: -1, // unlimited
    secret_limit: -1, // unlimited
    session_limit: -1, // unlimited
    audit_retention_days: -1, // custom/unlimited
    can_export_audit: true,
    can_share_vaults: true,
    has_api_access: true,
    has_sso: true,
  },
} as const

export type Tier = keyof typeof TIER_LIMITS
