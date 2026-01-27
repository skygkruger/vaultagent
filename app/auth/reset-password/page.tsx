'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { validatePassword } from '@/lib/encryption'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - RESET PASSWORD PAGE
// ═══════════════════════════════════════════════════════════════

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
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
|         [/] PASSWORD UPDATED             |
|                                          |
+------------------------------------------+`}
        </pre>
        <p className="text-xs mb-4" style={{ color: '#e8e3e3' }}>
          Your password has been successfully updated.
        </p>
        <p className="text-xs" style={{ color: '#6e6a86' }}>
          Redirecting to dashboard...
        </p>
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
|           [~] RESET PASSWORD             |
|                                          |
|        Enter your new password           |
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
            NEW PASSWORD
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 12 chars, mixed case, number, special"
              required
              className="flex-1 ml-2 bg-transparent outline-none text-xs"
              style={{ color: '#e8e3e3' }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: '#6e6a86' }}>
            // 12+ chars, uppercase, lowercase, number, special char
          </p>
        </div>

        <div>
          <label className="block text-xs mb-2" style={{ color: '#6e6a86' }}>
            CONFIRM NEW PASSWORD
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
            color: '#1a1a2e',
            border: 'none',
          }}
        >
          {loading ? '[~] UPDATING...' : '[>] UPDATE PASSWORD'}
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
