'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

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
  const { user, profile, signOut, loading } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center font-mono"
        style={{ backgroundColor: '#1a1a2e', color: '#a8d8b9' }}
      >
        <p className="text-xs">[~] Loading...</p>
      </div>
    )
  }

  const tierColors: Record<string, string> = {
    free: '#6e6a86',
    pro: '#a8d8b9',
    team: '#c4a7e7',
    enterprise: '#7eb8da',
  }

  return (
    <div
      className="min-h-screen font-mono text-sm flex"
      style={{ backgroundColor: '#1a1a2e', color: '#a8b2c3' }}
    >
      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 border-r flex flex-col"
        style={{ borderColor: '#6e6a86', backgroundColor: '#16161a' }}
      >
        {/* Logo */}
        <div className="p-4 border-b" style={{ borderColor: '#6e6a86' }}>
          <Link href="/" style={{ color: '#a8d8b9', textDecoration: 'none' }}>
            <div className="text-lg font-bold">VAULTAGENT</div>
            <div className="text-xs" style={{ color: '#6e6a86' }}>
              ::  ::
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b" style={{ borderColor: '#6e6a86' }}>
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
                className="block px-3 py-2 text-xs mb-1 transition-all"
                style={{
                  backgroundColor: isActive ? '#252542' : 'transparent',
                  color: isActive ? '#a8d8b9' : '#a8b2c3',
                  border: isActive ? '1px solid #a8d8b9' : '1px solid transparent',
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Usage Stats */}
        <div className="p-4 border-t" style={{ borderColor: '#6e6a86' }}>
          <div className="text-xs mb-2" style={{ color: '#6e6a86' }}>
            USAGE
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span style={{ color: '#6e6a86' }}>Vaults:</span>
              <span style={{ color: '#e8e3e3' }}>
                {profile?.vault_limit === -1 ? '∞' : `0/${profile?.vault_limit || 1}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#6e6a86' }}>Secrets:</span>
              <span style={{ color: '#e8e3e3' }}>
                {profile?.secret_limit === -1 ? '∞' : `0/${profile?.secret_limit || 10}`}
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade Prompt - Only show for free tier */}
        {(profile?.tier === 'free' || !profile?.tier) && (
          <div className="p-4 border-t" style={{ borderColor: '#6e6a86' }}>
            <Link
              href="/dashboard/account"
              className="block w-full text-center text-xs px-3 py-2 transition-all hover:opacity-80"
              style={{
                backgroundColor: '#a8d8b9',
                color: '#1a1a2e',
              }}
            >
              [*] UPGRADE PLAN
            </Link>
            <p className="text-xs mt-2 text-center" style={{ color: '#6e6a86' }}>
              Get more vaults & secrets
            </p>
          </div>
        )}

        {/* Manage Subscription - Show for paid tiers */}
        {profile?.tier && profile.tier !== 'free' && (
          <div className="p-4 border-t" style={{ borderColor: '#6e6a86' }}>
            <Link
              href="/dashboard/account"
              className="block w-full text-center text-xs px-3 py-2 transition-all hover:opacity-80"
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
        <div className="p-4 border-t" style={{ borderColor: '#6e6a86' }}>
          <button
            onClick={handleSignOut}
            className="w-full text-left text-xs px-3 py-2 transition-all hover:bg-[#252542]"
            style={{ color: '#eb6f92' }}
          >
            [x] Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
