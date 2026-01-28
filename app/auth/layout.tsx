import Link from 'next/link'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - AUTH LAYOUT
//  Shared layout for authentication pages
// ═══════════════════════════════════════════════════════════════

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen font-mono text-sm flex flex-col"
      style={{
        backgroundColor: '#141a17',
        color: '#adb7ac',
      }}
    >
      {/* Header */}
      <header className="border-b" style={{ borderColor: '#5f5d64' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" style={{ color: '#a8d8b9', fontSize: '18px', textDecoration: 'none' }}>
            VaultAgent
          </Link>
          <nav className="flex gap-3 sm:gap-6 text-xs">
            <Link href="/" style={{ color: '#5f5d64' }}>[~]<span className="hidden sm:inline"> Home</span></Link>
            <Link href="/docs" style={{ color: '#5f5d64' }}>[?]<span className="hidden sm:inline"> Docs</span></Link>
            <Link href="/pricing" style={{ color: '#5f5d64' }}>[$]<span className="hidden sm:inline"> Pricing</span></Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-xs" style={{ borderColor: '#5f5d64', color: '#5f5d64' }}>
        <p>Secured with [/] zero-knowledge encryption</p>
      </footer>
    </div>
  )
}
