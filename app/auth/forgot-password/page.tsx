'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - FORGOT PASSWORD PAGE
// ═══════════════════════════════════════════════════════════════

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="w-full max-w-md text-center">
        <pre
          className="text-xs mb-8"
          style={{ color: '#a8d8b9', overflow: 'visible' }}
        >
{`+------------------------------------------+
|                                          |
|           [/] CHECK YOUR EMAIL           |
|                                          |
+------------------------------------------+`}
        </pre>
        <p className="text-xs mb-4" style={{ color: '#e8e3e3' }}>
          We&apos;ve sent a password reset link to <strong>{email}</strong>
        </p>
        <p className="text-xs" style={{ color: '#6e6a86' }}>
          Click the link in the email to reset your password.
        </p>
        <div className="mt-6">
          <Link
            href="/auth/sign-in"
            className="text-xs"
            style={{ color: '#a8d8b9' }}
          >
            [&lt;] Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <pre
        className="text-xs mb-8 text-center"
        style={{ color: '#a8d8b9', overflow: 'visible' }}
      >
{`+------------------------------------------+
|                                          |
|           [?] FORGOT PASSWORD            |
|                                          |
|     Enter your email to reset it         |
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
          <label className="block text-xs mb-2" style={{ color: '#6e6a86' }}>
            EMAIL
          </label>
          <div
            className="flex items-center p-3"
            style={{
              backgroundColor: '#252542',
              border: '1px solid #6e6a86',
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
          {loading ? '[~] SENDING...' : '[>] SEND RESET LINK'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs">
        <Link href="/auth/sign-in" style={{ color: '#6e6a86' }}>
          [&lt;] Back to sign in
        </Link>
      </div>
    </div>
  )
}
