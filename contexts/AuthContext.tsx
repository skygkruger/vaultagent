'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react'
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
  const [configError, setConfigError] = useState<string | null>(null)

  // Initialize Supabase client only on the client side
  useEffect(() => {
    try {
      setSupabase(createClient())
    } catch (error) {
      console.error('Failed to initialize Supabase:', error)
      setConfigError(error instanceof Error ? error.message : 'Failed to initialize authentication')
      setLoading(false)
    }
  }, [])

  // Fetch user profile from database
  const fetchProfile = async (userId: string, client: SupabaseClient) => {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    return data as Profile
  }

  // Refresh profile data
  const refreshProfile = async () => {
    if (user && supabase) {
      const profileData = await fetchProfile(user.id, supabase)
      setProfile(profileData)
    }
  }

  useEffect(() => {
    if (!supabase) return

    // Get initial session with timeout
    const initAuth = async () => {
      try {
        // Set a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        )

        const sessionPromise = supabase.auth.getSession()
        const result = await Promise.race([sessionPromise, timeoutPromise]) as Awaited<typeof sessionPromise>
        const { data: { session: currentSession } } = result

        if (currentSession) {
          setSession(currentSession)
          setUser(currentSession.user)
          const profileData = await fetchProfile(currentSession.user.id, supabase)
          setProfile(profileData)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          const profileData = await fetchProfile(currentSession.user.id, supabase)
          setProfile(profileData)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
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

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
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

  // Show configuration error if Supabase couldn't be initialized
  if (configError) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a2e',
        color: '#eb6f92',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'monospace',
      }}>
        <div>
          <pre style={{ color: '#a8d8b9', marginBottom: '1rem' }}>
{`+------------------------------------------+
|                                          |
|        [!] CONFIGURATION ERROR           |
|                                          |
+------------------------------------------+`}
          </pre>
          <p style={{ marginBottom: '1rem' }}>{configError}</p>
          <p style={{ color: '#6e6a86', fontSize: '0.875rem' }}>
            Please ensure environment variables are set in your deployment.
          </p>
        </div>
      </div>
    )
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
