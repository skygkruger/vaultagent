'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
{`+------------------------------------------+
|                                          |
|           [>] SIGN IN                    |
|                                          |
|       Access your secure vault           |
|                                          |
+------------------------------------------+`}
      </pre>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            className="p-3 text-xs"
            style={{
              backgroundColor: '#2a1a2e',
              border: '1px solid #eb6f92',
              color: '#eb6f92',
            }}
          >
            [!] {error}
          </div>
        )}

        <div>
          <label className="block text-xs mb-2" style={{ color: '#5f5d64' }}>
            EMAIL
          </label>
          <div
            className="flex items-center p-3"
            style={{
              backgroundColor: '#252542',
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
              backgroundColor: '#252542',
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
            color: '#1a1a2e',
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
