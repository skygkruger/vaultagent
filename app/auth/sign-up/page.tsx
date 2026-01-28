'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { validatePassword } from '@/lib/encryption'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - SIGN UP PAGE
// ═══════════════════════════════════════════════════════════════

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password strength
    const validation = validatePassword(password)
    if (!validation.valid) {
      setError(validation.errors[0])
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
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
{`┌──────────────────────────────────────────┐
│                                          │
│           [/] CHECK YOUR EMAIL           │
│                                          │
└──────────────────────────────────────────┘`}
        </pre>
        <p className="text-xs mb-4" style={{ color: '#e8e3e3' }}>
          We&apos;ve sent a confirmation link to <strong>{email}</strong>
        </p>
        <p className="text-xs" style={{ color: '#5f5d64' }}>
          Click the link in the email to activate your account and access your vault.
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
{`┌──────────────────────────────────────────┐
│                                          │
│           [+] CREATE ACCOUNT             │
│                                          │
│        Start securing your secrets       │
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
        [&gt;] SIGN UP WITH GITHUB
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
              placeholder="Min 12 chars, mixed case, number, special"
              required
              className="flex-1 ml-2 bg-transparent outline-none text-xs"
              style={{ color: '#e8e3e3' }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: '#5f5d64' }}>
            {`// 12+ chars, uppercase, lowercase, number, special char`}
          </p>
        </div>

        <div>
          <label className="block text-xs mb-2" style={{ color: '#5f5d64' }}>
            CONFIRM PASSWORD
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? '[~] CREATING ACCOUNT...' : '[>] CREATE ACCOUNT'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs">
        <p style={{ color: '#5f5d64' }}>
          Already have an account?{' '}
          <Link href="/auth/sign-in" style={{ color: '#a8d8b9' }}>
            Sign in
          </Link>
        </p>
      </div>

      <div
        className="mt-6 p-4 text-xs"
        style={{
          backgroundColor: '#1a211d',
          border: '1px solid #5f5d64',
        }}
      >
        <p style={{ color: '#a8d8b9', marginBottom: '8px' }}>[i] Zero-Knowledge Security</p>
        <p style={{ color: '#5f5d64', lineHeight: '1.5' }}>
          Your master password never leaves your device. We only store encrypted
          data that we cannot read. If you lose your password, we cannot recover
          your secrets.
        </p>
      </div>
    </div>
  )
}
