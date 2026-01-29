'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - AUTH CONTEXT
//  Client-side authentication state management
// ═══════════════════════════════════════════════════════════════

interface Profile {
  id: string
  email: string
  tier: 'free' | 'pro' | 'team' | 'enterprise'
  stripe_customer_id: string | null
  vault_limit: number
  secret_limit: number
  session_limit: number
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGitHub: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  // Initialize Supabase client
  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
      setLoading(false)
    }
  }, [])

  // Fetch profile helper
  const fetchProfile = async (userId: string, client: SupabaseClient): Promise<Profile | null> => {
    try {
      console.log('[AuthContext] Fetching profile for user:', userId)
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[AuthContext] Profile fetch error:', error)
        return null
      }
      console.log('[AuthContext] Profile fetched:', data)
      console.log('[AuthContext] Profile tier:', data?.tier)
      return data as Profile
    } catch (err) {
      console.error('[AuthContext] Profile fetch exception:', err)
      return null
    }
  }

  // Refresh profile
  const refreshProfile = async () => {
    if (user && supabase) {
      const profileData = await fetchProfile(user.id, supabase)
      setProfile(profileData)
    }
  }

  // Main auth initialization
  useEffect(() => {
    if (!supabase) return

    let isMounted = true

    const initAuth = async () => {
      try {
        // Try getUser (server call) first
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()

        if (!isMounted) return

        if (error || !currentUser) {
          setLoading(false)
          return
        }

        setUser(currentUser)

        // Get session (non-blocking)
        supabase.auth.getSession().then(({ data: { session: sess } }) => {
          if (isMounted && sess) {
            setSession(sess)
          }
        }).catch(() => {})

        // Fetch profile
        const profileData = await fetchProfile(currentUser.id, supabase)
        if (isMounted) {
          setProfile(profileData)
        }
      } catch (err) {
        // getUser() failed (AbortError, network issue, etc.)
        // Fall back to cached session which doesn't make a server call
        try {
          const { data: { session: cachedSession } } = await supabase.auth.getSession()
          if (!isMounted) return

          if (cachedSession?.user) {
            setUser(cachedSession.user)
            setSession(cachedSession)

            const profileData = await fetchProfile(cachedSession.user.id, supabase)
            if (isMounted) {
              setProfile(profileData)
            }
            return
          }
        } catch {
          // Session fallback also failed - user is truly not authenticated
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Hard timeout - loading WILL stop after 3 seconds no matter what
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth timeout - forcing loading to stop')
        setLoading(false)
      }
    }, 3000)

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          const profileData = await fetchProfile(currentSession.user.id, supabase)
          if (isMounted) {
            setProfile(profileData)
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      isMounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [supabase])

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Not initialized') }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error as Error | null }
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Not initialized') }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error as Error | null }
  }

  const signInWithGitHub = async () => {
    if (!supabase) return { error: new Error('Not initialized') }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error as Error | null }
  }

  const signOut = async () => {
    if (supabase) {
      try {
        // Race against a timeout so sign-out never hangs
        await Promise.race([
          supabase.auth.signOut(),
          new Promise(resolve => setTimeout(resolve, 3000)),
        ])
      } catch (err) {
        console.error('Sign out error:', err)
      }
    }
    // Clear all state regardless of Supabase result
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const resetPassword = async (email: string) => {
    if (!supabase) return { error: new Error('Not initialized') }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error: error as Error | null }
  }

  const updatePassword = async (password: string) => {
    if (!supabase) return { error: new Error('Not initialized') }
    const { error } = await supabase.auth.updateUser({
      password,
    })
    return { error: error as Error | null }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signInWithGitHub,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
