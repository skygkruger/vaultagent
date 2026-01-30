'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - SIGN IN PAGE
// ═══════════════════════════════════════════════════════════════

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for error from OAuth callback
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(errorParam)
      // Clean up URL
      window.history.replaceState({}, '', '/auth/sign-in')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="w-full max-w-md">
      <pre
        className="text-xs mb-8 text-center"
        style={{ color: '#a8d8b9', overflow: 'visible' }}
      >
{`┌──────────────────────────────────────────┐
│                                          │
│            [>] SIGN IN                   │
│                                          │
│        Access your secure vault          │
│                                          │
└──────────────────────────────────────────┘`}
      </pre>

      {error && (
        <div
          className="p-3 mb-4 text-xs"
          style={{
            backgroundColor: '#1e1517',
            border: '1px solid #eb6f92',
            color: '#eb6f92',
          }}
        >
          [!] {error}
        </div>
      )}

      <button
        type="button"
        onClick={async () => {
          setError(null)
          setLoading(true)
          const supabase = createClient()
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
            },
          })
          if (error) {
            setError(error.message)
            setLoading(false)
          }
        }}
        disabled={loading}
        className="w-full p-3 text-xs transition-all hover:translate-y-px disabled:opacity-50 mb-4"
        style={{
          backgroundColor: 'transparent',
          color: '#e8e3e3',
          border: '1px solid #5f5d64',
        }}
      >
        [&gt;] SIGN IN WITH GITHUB
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ backgroundColor: '#5f5d64' }} />
        <span className="text-xs" style={{ color: '#5f5d64' }}>or</span>
        <div className="flex-1 h-px" style={{ backgroundColor: '#5f5d64' }} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs mb-2" style={{ color: '#5f5d64' }}>
            EMAIL
          </label>
          <div
            className="flex items-center p-3"
            style={{
              backgroundColor: '#1a211d',
              border: '1px solid #5f5d64',
            }}
          >
            <span style={{ color: '#a8d8b9' }}>&gt;</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="flex-1 ml-2 bg-transparent outline-none text-xs"
              style={{ color: '#e8e3e3' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs mb-2" style={{ color: '#5f5d64' }}>
            PASSWORD
          </label>
          <div
            className="flex items-center p-3"
            style={{
              backgroundColor: '#1a211d',
              border: '1px solid #5f5d64',
            }}
          >
            <span style={{ color: '#a8d8b9' }}>&gt;</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
              className="flex-1 ml-2 bg-transparent outline-none text-xs"
              style={{ color: '#e8e3e3' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 text-xs transition-all hover:translate-y-px disabled:opacity-50"
          style={{
            backgroundColor: '#a8d8b9',
            color: '#141a17',
            border: 'none',
          }}
        >
          {loading ? '[~] SIGNING IN...' : '[>] SIGN IN'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs space-y-2">
        <p>
          <Link
            href="/auth/forgot-password"
            style={{ color: '#adb7ac' }}
          >
            [?] Forgot your password?
          </Link>
        </p>
        <p style={{ color: '#5f5d64' }}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/sign-up" style={{ color: '#a8d8b9' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
