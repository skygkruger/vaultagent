'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - ACCOUNT PAGE
//  Manage account settings and subscription
// ═══════════════════════════════════════════════════════════════

const TIER_INFO: Record<
  string,
  {
    name: string
    color: string
    features: string[]
    monthlyPrice: number
    yearlyPrice: number
  }
> = {
  free: {
    name: 'Free',
    color: '#6e6a86',
    features: ['1 vault', '10 secrets', '50 sessions/day', '7-day audit retention'],
    monthlyPrice: 0,
    yearlyPrice: 0,
  },
  pro: {
    name: 'Pro',
    color: '#a8d8b9',
    features: ['5 vaults', '100 secrets', 'Unlimited sessions', '30-day audit retention', 'Audit export'],
    monthlyPrice: 9,
    yearlyPrice: 90, // 2 months free
  },
  team: {
    name: 'Team',
    color: '#c4a7e7',
    features: [
      '20 vaults',
      '500 secrets',
      'Unlimited sessions',
      '90-day audit retention',
      'Audit export',
      'Team members',
    ],
    monthlyPrice: 29,
    yearlyPrice: 290, // 2 months free
  },
  enterprise: {
    name: 'Enterprise',
    color: '#7eb8da',
    features: [
      'Unlimited vaults',
      'Unlimited secrets',
      'Unlimited sessions',
      'Unlimited audit retention',
      'Audit export',
      'SSO/SAML',
      'Priority support',
    ],
    monthlyPrice: 99,
    yearlyPrice: 990, // 2 months free
  },
}

export default function AccountPage() {
  const { user, profile, updatePassword } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Billing toggle
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const tierInfo = TIER_INFO[profile?.tier || 'free']

  // Get display price based on billing period
  const getPrice = (tier: string) => {
    const info = TIER_INFO[tier]
    if (billingPeriod === 'yearly') {
      return `$${info.yearlyPrice}/year`
    }
    return `$${info.monthlyPrice}/mo`
  }

  // Get savings text for yearly
  const getSavings = (tier: string) => {
    const info = TIER_INFO[tier]
    const monthlyCost = info.monthlyPrice * 12
    const yearlyCost = info.yearlyPrice
    const savings = monthlyCost - yearlyCost
    if (savings > 0) {
      return `Save $${savings}/year`
    }
    return null
  }

  // Handle upgrade
  const handleUpgrade = async (plan: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          billing: billingPeriod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to start checkout')
      } else if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Failed to start checkout')
    }

    setLoading(false)
  }

  // Handle manage subscription
  const handleManageSubscription = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to open portal')
      } else if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Failed to open portal')
    }

    setLoading(false)
  }

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setChangingPassword(true)

    try {
      await updatePassword(newPassword)
      setSuccess('Password updated successfully')
      setShowPasswordForm(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    }

    setChangingPassword(false)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl mb-2" style={{ color: '#a8d8b9' }}>
          [@] Account Settings
        </h1>
        <p className="text-xs" style={{ color: '#6e6a86' }}>
          {`// manage your account and subscription`}
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div
          className="p-3 mb-6 text-xs"
          style={{
            backgroundColor: '#2a1a2e',
            border: '1px solid #eb6f92',
            color: '#eb6f92',
          }}
        >
          [!] {error}
        </div>
      )}

      {success && (
        <div
          className="p-3 mb-6 text-xs"
          style={{
            backgroundColor: '#1a2e1a',
            border: '1px solid #a8d8b9',
            color: '#a8d8b9',
          }}
        >
          [✓] {success}
        </div>
      )}

      {/* Profile Section */}
      <div
        className="mb-6 p-4"
        style={{ border: '1px solid #6e6a86' }}
      >
        <h2
          className="text-sm mb-4 pb-3"
          style={{ color: '#a8d8b9', borderBottom: '1px solid #6e6a86' }}
        >
          Profile
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: '#6e6a86' }}>
              EMAIL
            </span>
            <span className="text-xs" style={{ color: '#e8e3e3' }}>
              {user?.email}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: '#6e6a86' }}>
              USER ID
            </span>
            <span className="text-xs font-mono" style={{ color: '#6e6a86' }}>
              {user?.id?.substring(0, 8)}...
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: '#6e6a86' }}>
              MEMBER SINCE
            </span>
            <span className="text-xs" style={{ color: '#e8e3e3' }}>
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div
        className="mb-6 p-4"
        style={{ border: '1px solid #6e6a86' }}
      >
        <h2
          className="text-sm mb-4 pb-3"
          style={{ color: '#a8d8b9', borderBottom: '1px solid #6e6a86' }}
        >
          Security
        </h2>

        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="text-xs px-4 py-2 transition-all hover-border-glow hover-text-glow"
            style={{
              border: '1px solid #6e6a86',
              color: '#a8b2c3',
              backgroundColor: 'transparent',
            }}
          >
            [~] CHANGE PASSWORD
          </button>
        ) : (
          <form onSubmit={handlePasswordChange}>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-xs mb-2" style={{ color: '#6e6a86' }}>
                  NEW PASSWORD
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full max-w-xs px-3 py-2 text-xs"
                  style={{
                    backgroundColor: '#252542',
                    border: '1px solid #6e6a86',
                    color: '#e8e3e3',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: '#6e6a86' }}>
                  CONFIRM PASSWORD
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full max-w-xs px-3 py-2 text-xs"
                  style={{
                    backgroundColor: '#252542',
                    border: '1px solid #6e6a86',
                    color: '#e8e3e3',
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="text-xs px-4 py-2 disabled:opacity-50 transition-all hover-glow hover-lift"
                style={{
                  backgroundColor: '#a8d8b9',
                  color: '#1a1a2e',
                }}
              >
                {changingPassword ? '[~] UPDATING...' : '[>] UPDATE PASSWORD'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false)
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="text-xs px-4 py-2 transition-all hover-border-glow hover-text-glow"
                style={{
                  border: '1px solid #6e6a86',
                  color: '#6e6a86',
                  backgroundColor: 'transparent',
                }}
              >
                [x] CANCEL
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Subscription Section */}
      <div
        className="mb-6 p-4"
        style={{ border: '1px solid #6e6a86' }}
      >
        <h2
          className="text-sm mb-4 pb-3"
          style={{ color: '#a8d8b9', borderBottom: '1px solid #6e6a86' }}
        >
          Subscription
        </h2>

        {/* Current Plan */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <span
              className="text-lg font-bold"
              style={{ color: tierInfo.color }}
            >
              {tierInfo.name}
            </span>
            <span
              className="text-xs px-2 py-1"
              style={{
                border: `1px solid ${tierInfo.color}`,
                color: tierInfo.color,
              }}
            >
              {tierInfo.monthlyPrice === 0 ? 'Free' : `$${tierInfo.monthlyPrice}/month`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tierInfo.features.map((feature) => (
              <span
                key={feature}
                className="text-xs px-2 py-1"
                style={{
                  backgroundColor: '#252542',
                  color: '#a8b2c3',
                }}
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Upgrade Options or Manage */}
        {(!profile?.tier || profile?.tier === 'free') ? (
          <div className="space-y-4">
            <p className="text-xs" style={{ color: '#6e6a86' }}>
              Upgrade for more vaults, secrets, and longer audit retention:
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className="text-xs px-3 py-1 transition-all"
                style={{
                  backgroundColor: billingPeriod === 'monthly' ? '#a8d8b9' : 'transparent',
                  color: billingPeriod === 'monthly' ? '#1a1a2e' : '#6e6a86',
                  border: '1px solid #a8d8b9',
                }}
              >
                MONTHLY
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className="text-xs px-3 py-1 transition-all"
                style={{
                  backgroundColor: billingPeriod === 'yearly' ? '#a8d8b9' : 'transparent',
                  color: billingPeriod === 'yearly' ? '#1a1a2e' : '#6e6a86',
                  border: '1px solid #a8d8b9',
                }}
              >
                YEARLY
              </button>
              {billingPeriod === 'yearly' && (
                <span className="text-xs px-2 py-1" style={{ color: '#a8d8b9', backgroundColor: '#1a2e1a' }}>
                  2 MONTHS FREE
                </span>
              )}
            </div>

            {/* Upgrade Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleUpgrade('pro')}
                disabled={loading}
                className="text-xs px-4 py-2 disabled:opacity-50 transition-all hover-border-glow hover-text-glow hover-lift"
                style={{
                  border: '1px solid #a8d8b9',
                  color: '#a8d8b9',
                  backgroundColor: 'transparent',
                }}
              >
                <span>{`[>] PRO - ${getPrice('pro')}`}</span>
                {billingPeriod === 'yearly' && getSavings('pro') && (
                  <span className="ml-2 opacity-70">({getSavings('pro')})</span>
                )}
              </button>
              <button
                onClick={() => handleUpgrade('team')}
                disabled={loading}
                className="text-xs px-4 py-2 disabled:opacity-50 transition-all hover-border-glow hover-text-glow hover-lift"
                style={{
                  border: '1px solid #c4a7e7',
                  color: '#c4a7e7',
                  backgroundColor: 'transparent',
                }}
              >
                <span>{`[>] TEAM - ${getPrice('team')}`}</span>
                {billingPeriod === 'yearly' && getSavings('team') && (
                  <span className="ml-2 opacity-70">({getSavings('team')})</span>
                )}
              </button>
              <button
                onClick={() => handleUpgrade('enterprise')}
                disabled={loading}
                className="text-xs px-4 py-2 disabled:opacity-50 transition-all hover-border-glow hover-text-glow hover-lift"
                style={{
                  border: '1px solid #7eb8da',
                  color: '#7eb8da',
                  backgroundColor: 'transparent',
                }}
              >
                <span>{`[>] ENTERPRISE - ${getPrice('enterprise')}`}</span>
                {billingPeriod === 'yearly' && getSavings('enterprise') && (
                  <span className="ml-2 opacity-70">({getSavings('enterprise')})</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleManageSubscription}
              disabled={loading}
              className="text-xs px-4 py-2 disabled:opacity-50 transition-all hover-border-glow hover-text-glow"
              style={{
                border: '1px solid #6e6a86',
                color: '#a8b2c3',
                backgroundColor: 'transparent',
              }}
            >
              {loading ? '[~] LOADING...' : '[>] MANAGE SUBSCRIPTION'}
            </button>
            <button
              onClick={async () => {
                setLoading(true)
                try {
                  const res = await fetch('/api/stripe/sync', { method: 'POST' })
                  const data = await res.json()
                  if (data.synced) {
                    setSuccess(`Synced: ${data.tier} tier`)
                    window.location.reload()
                  } else {
                    setError(data.error || data.message || 'Sync failed')
                  }
                } catch {
                  setError('Failed to sync')
                }
                setLoading(false)
              }}
              disabled={loading}
              className="text-xs px-4 py-2 disabled:opacity-50 transition-all hover-border-glow hover-text-glow"
              style={{
                border: '1px solid #a8d8b9',
                color: '#a8d8b9',
                backgroundColor: 'transparent',
              }}
            >
              {loading ? '[~] SYNCING...' : '[~] SYNC FROM STRIPE'}
            </button>
          </div>
        )}
      </div>

      {/* Usage Section */}
      <div
        className="mb-6 p-4"
        style={{ border: '1px solid #6e6a86' }}
      >
        <h2
          className="text-sm mb-4 pb-3"
          style={{ color: '#a8d8b9', borderBottom: '1px solid #6e6a86' }}
        >
          Current Usage
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs mb-1" style={{ color: '#6e6a86' }}>
              VAULTS
            </div>
            <div className="text-lg" style={{ color: '#e8e3e3' }}>
              0 / {profile?.vault_limit === -1 ? '∞' : (profile?.vault_limit ?? 1)}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: '#6e6a86' }}>
              SECRETS
            </div>
            <div className="text-lg" style={{ color: '#e8e3e3' }}>
              0 / {profile?.secret_limit === -1 ? '∞' : (profile?.secret_limit ?? 10)}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: '#6e6a86' }}>
              SESSIONS TODAY
            </div>
            <div className="text-lg" style={{ color: '#e8e3e3' }}>
              0 / {profile?.session_limit === -1 ? '∞' : (profile?.session_limit ?? 50)}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: '#6e6a86' }}>
              AUDIT RETENTION
            </div>
            <div className="text-lg" style={{ color: '#e8e3e3' }}>
              {TIER_INFO[profile?.tier || 'free'].features.find((f) =>
                f.includes('audit')
              ) || '7 days'}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div
        className="p-4"
        style={{ border: '1px solid #eb6f92' }}
      >
        <h2
          className="text-sm mb-4 pb-3"
          style={{ color: '#eb6f92', borderBottom: '1px solid #eb6f92' }}
        >
          Danger Zone
        </h2>
        <p className="text-xs mb-4" style={{ color: '#6e6a86' }}>
          Delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          onClick={() => {
            if (
              confirm(
                'Are you sure you want to delete your account? All your vaults, secrets, and data will be permanently deleted.'
              )
            ) {
              alert('Account deletion coming soon. Contact support@vaultagent.dev')
            }
          }}
          className="text-xs px-4 py-2 transition-all hover:bg-[#eb6f92] hover:text-[#1a1a2e]"
          style={{
            border: '1px solid #eb6f92',
            color: '#eb6f92',
            backgroundColor: 'transparent',
          }}
        >
          [!] DELETE ACCOUNT
        </button>
      </div>
    </div>
  )
}
