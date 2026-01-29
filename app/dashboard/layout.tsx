'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getTierLimits } from '@/lib/tier-limits'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - DASHBOARD LAYOUT
//  Authenticated layout with sidebar navigation
// ═══════════════════════════════════════════════════════════════

const navItems = [
  { href: '/dashboard', label: '[/] Vault', icon: '/' },
  { href: '/dashboard/sessions', label: '[~] Sessions', icon: '~' },
  { href: '/dashboard/audit', label: '[>] Audit Log', icon: '>' },
  { href: '/dashboard/account', label: '[@] Account', icon: '@' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut, loading, refreshProfile } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tierSynced, setTierSynced] = useState(false)
  const [vaultCount, setVaultCount] = useState(0)
  const [secretCount, setSecretCount] = useState(0)

  const handleSignOut = async () => {
    await signOut()
    // Clear any cached state by doing a full page navigation
    window.location.href = '/'
  }

  // Redirect to sign-in if not authenticated (after loading completes)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/sign-in')
    }
  }, [loading, user, router])

  // Fetch actual usage counts via API
  useEffect(() => {
    if (!user) return

    const fetchCounts = async () => {
      try {
        const [vaultsRes, secretsRes] = await Promise.all([
          fetch('/api/vaults'),
          fetch('/api/secrets'),
        ])

        if (vaultsRes.ok) {
          const data = await vaultsRes.json()
          setVaultCount(data.vaults?.length ?? 0)
        }
        if (secretsRes.ok) {
          const data = await secretsRes.json()
          setSecretCount(data.secrets?.length ?? 0)
        }
      } catch {}
    }

    fetchCounts()
  }, [user, pathname])

  // Auto-sync tier from Stripe if user has a customer ID but shows free
  useEffect(() => {
    if (tierSynced || !profile || !user) return
    if (profile.stripe_customer_id && profile.tier === 'free') {
      setTierSynced(true)
      fetch('/api/stripe/sync', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.synced && data.tier !== 'free') {
            refreshProfile()
          }
        })
        .catch(() => {})
    }
  }, [tierSynced, profile, user, refreshProfile])

  // Show loading state (max 3 seconds due to AuthContext timeout)
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center font-mono"
        style={{ backgroundColor: '#141a17', color: '#a8d8b9' }}
      >
        <p className="text-xs">[~] Loading...</p>
      </div>
    )
  }

  // Show redirecting state if no user
  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center font-mono"
        style={{ backgroundColor: '#141a17', color: '#a8d8b9' }}
      >
        <p className="text-xs">[~] Redirecting to sign in...</p>
      </div>
    )
  }

  const tierColors: Record<string, string> = {
    free: '#5f5d64',
    pro: '#a8d8b9',
    team: '#bba7c0',
    enterprise: '#adb7ac',
  }

  return (
    <div
      className="min-h-screen font-mono text-sm flex flex-col lg:flex-row"
      style={{ backgroundColor: '#141a17', color: '#adb7ac' }}
    >
      {/* Mobile Header */}
      <div
        className="lg:hidden flex items-center justify-between p-4 border-b"
        style={{ borderColor: '#5f5d64', backgroundColor: '#16161a' }}
      >
        <Link href="/" style={{ color: '#a8d8b9', textDecoration: 'none' }}>
          <div className="text-lg font-bold">VAULTAGENT</div>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-xs"
          style={{ color: '#a8d8b9' }}
        >
          {sidebarOpen ? '[x] CLOSE' : '[=] MENU'}
        </button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 lg:w-56 flex-shrink-0 border-r flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ borderColor: '#5f5d64', backgroundColor: '#16161a' }}
      >
        {/* Logo */}
        <div className="p-4 border-b" style={{ borderColor: '#5f5d64' }}>
          <Link href="/" style={{ color: '#a8d8b9', textDecoration: 'none' }}>
            <div className="text-lg font-bold">VAULTAGENT</div>
            <div className="text-xs" style={{ color: '#5f5d64' }}>
              ::  ::
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b" style={{ borderColor: '#5f5d64' }}>
          <div className="text-xs truncate" style={{ color: '#e8e3e3' }}>
            {user?.email}
          </div>
          <div
            className="text-xs mt-1 inline-block px-2 py-0.5"
            style={{
              color: tierColors[profile?.tier || 'free'],
              border: `1px solid ${tierColors[profile?.tier || 'free']}`,
            }}
          >
            {(profile?.tier || 'free').toUpperCase()}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="block px-3 py-2 text-xs mb-1 transition-all hover-border-glow"
                style={{
                  backgroundColor: isActive ? '#1a211d' : 'transparent',
                  color: isActive ? '#a8d8b9' : '#adb7ac',
                  border: isActive ? '1px solid #a8d8b9' : '1px solid transparent',
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Usage Stats */}
        <div className="p-4 border-t" style={{ borderColor: '#5f5d64' }}>
          <div className="text-xs mb-2" style={{ color: '#5f5d64' }}>
            USAGE
          </div>
          <div className="space-y-1 text-xs">
            {(() => {
              const limits = getTierLimits(profile?.tier)
              return (
                <>
                  <div className="flex justify-between">
                    <span style={{ color: '#5f5d64' }}>Vaults:</span>
                    <span style={{ color: '#e8e3e3' }}>
                      {limits.vault_limit === -1 ? `${vaultCount} / ∞` : `${vaultCount}/${limits.vault_limit}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#5f5d64' }}>Secrets:</span>
                    <span style={{ color: '#e8e3e3' }}>
                      {limits.secret_limit === -1 ? `${secretCount} / ∞` : `${secretCount}/${limits.secret_limit}`}
                    </span>
                  </div>
                </>
              )
            })()}
          </div>
        </div>

        {/* Upgrade Prompt - Only show for free tier */}
        {(profile?.tier === 'free' || !profile?.tier) && (
          <div className="p-4 border-t" style={{ borderColor: '#5f5d64' }}>
            <Link
              href="/dashboard/account"
              onClick={() => setSidebarOpen(false)}
              className="block w-full text-center text-xs px-3 py-2 transition-all hover-glow hover-lift"
              style={{
                backgroundColor: '#a8d8b9',
                color: '#141a17',
              }}
            >
              [*] UPGRADE PLAN
            </Link>
            <p className="text-xs mt-2 text-center" style={{ color: '#5f5d64' }}>
              Get more vaults & secrets
            </p>
          </div>
        )}

        {/* Manage Subscription - Show for paid tiers */}
        {profile?.tier && profile.tier !== 'free' && (
          <div className="p-4 border-t" style={{ borderColor: '#5f5d64' }}>
            <Link
              href="/dashboard/account"
              onClick={() => setSidebarOpen(false)}
              className="block w-full text-center text-xs px-3 py-2 transition-all hover-border-glow hover-text-glow"
              style={{
                border: `1px solid ${tierColors[profile.tier]}`,
                color: tierColors[profile.tier],
              }}
            >
              [~] MANAGE PLAN
            </Link>
          </div>
        )}

        {/* Sign Out */}
        <div className="p-4 border-t" style={{ borderColor: '#5f5d64' }}>
          <button
            onClick={handleSignOut}
            className="w-full text-left text-xs px-3 py-2 transition-all hover:bg-[#1a211d] hover-text-glow"
            style={{ color: '#eb6f92' }}
          >
            [x] Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-h-0">
        {children}
      </main>
    </div>
  )
}
