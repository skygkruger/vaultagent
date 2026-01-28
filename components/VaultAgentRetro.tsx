'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - PASTEL RETRO TERMINAL REDESIGN
//  Primary Accent: Soft Mint (#a8d8b9)
// ═══════════════════════════════════════════════════════════════

export default function VaultAgentRetro() {
  const [activeTab, setActiveTab] = useState(0);
  const [secretName, setSecretName] = useState('');
  const [secretValue, setSecretValue] = useState('');
  const [sessionDuration, setSessionDuration] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [demoVault, setDemoVault] = useState([
    { name: 'OPENAI_API_KEY', masked: '***************k4Fj', lastAccessed: '2 min ago', status: 'active' },
    { name: 'DATABASE_URL', masked: '***************5432', lastAccessed: '15 min ago', status: 'active' },
    { name: 'STRIPE_SECRET', masked: '***************test', lastAccessed: '1 hour ago', status: 'expired' },
  ]);
  const [auditLog, setAuditLog] = useState([
    { time: '14:32:01', action: 'SESSION_CREATE', agent: 'claude-code', secrets: ['OPENAI_API_KEY'] },
    { time: '14:32:05', action: 'SECRET_ACCESS', agent: 'claude-code', secrets: ['OPENAI_API_KEY'] },
    { time: '14:47:22', action: 'SESSION_EXPIRE', agent: 'claude-code', secrets: ['OPENAI_API_KEY'] },
  ]);

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  const handleCreateSecret = async () => {
    if (!secretName.trim() || !secretValue.trim()) return;
    setIsCreating(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setDemoVault(prev => [...prev, {
      name: secretName.toUpperCase().replace(/\s+/g, '_'),
      masked: '***************' + secretValue.slice(-4),
      lastAccessed: 'just now',
      status: 'active'
    }]);
    setSecretName('');
    setSecretValue('');
    setIsCreating(false);
  };

  const tabs = ['VAULT', 'SESSIONS', 'AUDIT LOG'];

  const durations = [
    { label: '15 MIN', value: 0.25, desc: 'quick task' },
    { label: '1 HOUR', value: 1, desc: 'standard session' },
    { label: '4 HOURS', value: 4, desc: 'deep work' },
    { label: '24 HOURS', value: 24, desc: 'extended access' },
  ];

  return (
    <div
      className="min-h-screen font-mono text-sm"
      style={{
        backgroundColor: '#141a17',
        color: '#adb7ac'
      }}
    >
      {/* ═══════════════════════════════════════════════════════ */}
      {/*                       HEADER                            */}
      {/* ═══════════════════════════════════════════════════════ */}

      <header className="border-b" style={{ borderColor: '#5f5d64' }}>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-lg tracking-tight" style={{ color: '#a8d8b9' }}>VAULTAGENT</span>
              <span
                className="transition-opacity"
                style={{
                  color: '#a8d8b9',
                  opacity: cursorVisible ? 1 : 0
                }}
              >_</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {[
                { label: 'DOCS', href: '/docs' },
                { label: 'PRICING', href: '/pricing' },
                { label: 'GITHUB', href: 'https://github.com/skygkruger' },
                { label: '@', href: 'https://x.com/run_veridian' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="relative transition-colors duration-200"
                  style={{ color: hoveredNav === item.label ? '#a8d8b9' : '#5f5d64' }}
                  onMouseEnter={() => setHoveredNav(item.label)}
                  onMouseLeave={() => setHoveredNav(null)}
                >
                  <span className={`transition-all duration-200 ${hoveredNav === item.label ? 'pl-4' : ''}`}>
                    {hoveredNav === item.label && <span className="absolute left-0" style={{ color: '#a8d8b9' }}>&gt;</span>}
                    [{item.label}]
                  </span>
                </Link>
              ))}
              <Link
                href="/auth/sign-in"
                className="px-4 py-1.5 transition-all duration-200"
                style={{
                  border: '1px solid #a8d8b9',
                  color: '#a8d8b9',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#a8d8b9';
                  e.currentTarget.style.color = '#141a17';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#a8d8b9';
                }}
              >
                [LOGIN]
              </Link>
            </nav>

            {/* Mobile Menu */}
            <div className="flex md:hidden items-center gap-3">
              <Link href="/docs" className="px-3 py-1 text-xs" style={{ color: '#5f5d64' }}>[DOCS]</Link>
              <Link
                href="/auth/sign-in"
                className="px-3 py-1 text-xs"
                style={{
                  border: '1px solid #a8d8b9',
                  color: '#a8d8b9',
                }}
              >
                [LOGIN]
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                     ASCII LOGO                          */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="flex flex-col items-center" style={{ color: '#a8d8b9' }}>
          {/* ASCII Logo - responsive */}
          <pre style={{
            fontSize: 'clamp(9px, 2.5vw, 16px)',
            lineHeight: 1.05,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            textAlign: 'left',
            margin: 0,
            padding: 0,
            border: 'none',
            background: 'none',
            overflow: 'visible'
          }}>
{`██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗
██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝
██║   ██║███████║██║   ██║██║     ██║
╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║
 ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║
  ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝`}
          </pre>
          <div className="flex justify-center w-full" style={{ marginTop: '8px' }}>
            <pre style={{
              fontSize: 'clamp(7px, 1.8vw, 12px)',
              lineHeight: 1.05,
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              textAlign: 'left',
              color: '#a8d8b9',
              margin: 0,
              padding: 0,
              border: 'none',
              background: 'none',
              overflow: 'visible'
            }}>
{`┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│ A ├─┤ G ├─┤ E ├─┤ N ├─┤ T │
└───┘ └───┘ └───┘ └───┘ └───┘`}
            </pre>
          </div>
          <p className="text-xs tracking-widest mt-4" style={{ color: '#bba7c0' }}>
            ·:·:· SECURE SECRET MANAGEMENT ·:·:·
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                      TAGLINE                            */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="text-center space-y-2">
          <p style={{ color: '#e8e3e3' }}>
            AI agents need secrets. They shouldn&apos;t see them.
          </p>
          <p className="text-xs" style={{ color: '#5f5d64' }}>
            {`// zero-knowledge encryption, scoped sessions, full audit trails`}
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    TAB NAVIGATION                       */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="flex justify-center">
          {/* Desktop Tabs */}
          <div className="hidden sm:block" style={{ color: '#a8d8b9' }}>
            <pre className="text-xs">
{`┌──────────────────┬──────────────────┬──────────────────┐`}
            </pre>
            <div className="flex border-l border-r" style={{ borderColor: '#a8d8b9' }}>
              {tabs.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  className="flex-1 text-center py-1 text-xs transition-all hover-text-glow"
                  style={{
                    color: activeTab === i ? '#a8d8b9' : '#5f5d64',
                    width: '18ch',
                  }}
                >
                  {activeTab === i ? `[*] ${tab}` : tab}
                </button>
              ))}
            </div>
            <pre className="text-xs">
{`└──────────────────┴──────────────────┴──────────────────┘`}
            </pre>
          </div>
          {/* Mobile Tabs */}
          <div className="sm:hidden flex w-full border" style={{ borderColor: '#a8d8b9' }}>
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className="flex-1 text-center py-2 text-xs transition-all"
                style={{
                  color: activeTab === i ? '#a8d8b9' : '#5f5d64',
                  backgroundColor: activeTab === i ? '#27252a' : 'transparent',
                  borderRight: i < tabs.length - 1 ? '1px solid #a8d8b9' : 'none',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    VAULT TAB                            */}
        {/* ═══════════════════════════════════════════════════════ */}

        {activeTab === 0 && (
          <div className="space-y-4">
            {/* Secret List */}
            <div className="sm:flex sm:justify-center">
              <div className="w-full sm:w-auto" style={{ color: '#a8d8b9' }}>
                {/* Desktop header */}
                <pre className="hidden sm:block text-xs" style={{ margin: 0 }}>
{`┌─────────────────────────────────────────────────────────────────────────────┐
│  YOUR SECRETS                                                      [+] ADD  │
├─────────────────────────────────────────────────────────────────────────────┤`}
                </pre>
                {/* Mobile header */}
                <div className="sm:hidden flex justify-between items-center p-3 border border-b-0" style={{ borderColor: '#a8d8b9' }}>
                  <span className="text-xs">YOUR SECRETS</span>
                  <span className="text-xs">[+] ADD</span>
                </div>

                <div
                  className="w-full px-3 sm:px-4 py-2 border-l border-r space-y-1"
                  style={{ borderColor: '#a8d8b9' }}
                >
                  {demoVault.map((secret, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 text-xs gap-1"
                      style={{
                        color: secret.status === 'active' ? '#e8e3e3' : '#5f5d64'
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span style={{ color: secret.status === 'active' ? '#a8d8b9' : '#eb6f92' }}>
                          {secret.status === 'active' ? '[/]' : '[x]'}
                        </span>
                        <span>{secret.name}</span>
                      </span>
                      <span className="flex items-center gap-4 pl-6 sm:pl-0">
                        <span className="hidden sm:inline" style={{ color: '#5f5d64' }}>{secret.masked}</span>
                        <span style={{ color: '#5f5d64' }}>{secret.lastAccessed}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <pre className="hidden sm:block text-xs" style={{ margin: 0 }}>
{`└─────────────────────────────────────────────────────────────────────────────┘`}
                </pre>
                <div className="sm:hidden border-t" style={{ borderColor: '#a8d8b9' }}></div>
              </div>
            </div>

            {/* Add Secret Form */}
            <div className="sm:flex sm:justify-center">
              <div className="w-full sm:w-auto" style={{ color: '#a8d8b9' }}>
                <pre className="hidden sm:block text-xs" style={{ margin: 0 }}>
{`┌─────────────────────────────────────────────────────────────────────────────┐
│  ADD NEW SECRET                                                             │
├─────────────────────────────────────────────────────────────────────────────┤`}
                </pre>
                <div className="sm:hidden p-3 border border-b-0" style={{ borderColor: '#a8d8b9' }}>
                  <span className="text-xs">ADD NEW SECRET</span>
                </div>

                <div
                  className="w-full px-3 sm:px-4 py-4 border-l border-r space-y-3"
                  style={{ borderColor: '#a8d8b9' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#5f5d64' }}>NAME:</span>
                    <span style={{ color: '#f2cdcd' }}>{'>'}</span>
                    <span
                      className="transition-opacity hidden sm:inline"
                      style={{
                        color: '#f2cdcd',
                        opacity: cursorVisible ? 1 : 0
                      }}
                    >█</span>
                    <input
                      value={secretName}
                      onChange={(e) => setSecretName(e.target.value)}
                      placeholder="OPENAI_API_KEY"
                      className="flex-1 bg-transparent outline-none text-xs min-w-0"
                      style={{
                        color: '#e8e3e3',
                        caretColor: 'transparent',
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#5f5d64' }}>VALUE:</span>
                    <span style={{ color: '#f2cdcd' }}>{'>'}</span>
                    <input
                      type="password"
                      value={secretValue}
                      onChange={(e) => setSecretValue(e.target.value)}
                      placeholder="sk-xxxxxxxxxxxxxxxx"
                      className="flex-1 bg-transparent outline-none text-xs min-w-0"
                      style={{
                        color: '#e8e3e3',
                        caretColor: '#f2cdcd',
                      }}
                    />
                  </div>
                </div>

                <pre className="hidden sm:block text-xs" style={{ margin: 0 }}>
{`└─────────────────────────────────────────────────────────────────────────────┘`}
                </pre>
                <div className="sm:hidden border-t" style={{ borderColor: '#a8d8b9' }}></div>
              </div>
            </div>

            {/* Create Button */}
            <div className="flex justify-center">
              <button
                onClick={handleCreateSecret}
                disabled={isCreating || !secretName.trim() || !secretValue.trim()}
                className="transition-all hover-highlight disabled:opacity-50 w-full sm:w-auto"
                style={{ color: '#a8d8b9' }}
              >
                <pre className="hidden sm:block text-xs leading-tight">
{isCreating
  ? `┌─────────────────────────┐
│  [~] ENCRYPTING...      │
└─────────────────────────┘`
  : `┌─────────────────────────┐
│  [>] STORE SECRET       │
└─────────────────────────┘`}
                </pre>
                <div className="sm:hidden py-3 px-6 border text-xs text-center" style={{ borderColor: '#a8d8b9' }}>
                  {isCreating ? '[~] ENCRYPTING...' : '[>] STORE SECRET'}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    SESSIONS TAB                         */}
        {/* ═══════════════════════════════════════════════════════ */}

        {activeTab === 1 && (
          <div className="space-y-4">
            {/* Session Duration Selector */}
            <div className="overflow-x-auto">
              <div style={{ color: '#e8e3e3', minWidth: '320px' }}>
                <pre className="hidden sm:block text-xs">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│  CREATE AGENT SESSION                                                       │
├─────────────────────────────────────────────────────────────────────────────┤`}
                </pre>
                <div className="sm:hidden p-3 border border-b-0" style={{ borderColor: '#e8e3e3' }}>
                  <span className="text-xs">CREATE AGENT SESSION</span>
                </div>

                <div
                  className="px-3 sm:px-4 py-3 border-l border-r space-y-2"
                  style={{ borderColor: '#e8e3e3' }}
                >
                  <p className="text-xs" style={{ color: '#5f5d64' }}>{`// select session duration`}</p>
                  {durations.map((dur) => (
                    <button
                      key={dur.label}
                      onClick={() => setSessionDuration(dur.value)}
                      className="w-full text-left flex items-center gap-2 sm:gap-4 py-2 transition-all hover:translate-x-1"
                      style={{
                        color: sessionDuration === dur.value ? '#a8d8b9' : '#5f5d64'
                      }}
                    >
                      <span className="w-6">{sessionDuration === dur.value ? '[x]' : '[ ]'}</span>
                      <span className="w-16">{dur.label}</span>
                      <span className="hidden sm:inline text-xs" style={{ color: '#5f5d64' }}>{`// ${dur.desc}`}</span>
                    </button>
                  ))}
                </div>

                <pre className="hidden sm:block text-xs">
{`├─────────────────────────────────────────────────────────────────────────────┤
│  SELECTED: ${String(sessionDuration).padEnd(2)} HOUR(S)                                                      │
└─────────────────────────────────────────────────────────────────────────────┘`}
                </pre>
                <div className="sm:hidden p-3 border-t border-l border-r border-b" style={{ borderColor: '#e8e3e3' }}>
                  <span className="text-xs">SELECTED: {sessionDuration} HOUR(S)</span>
                </div>
              </div>
            </div>

            {/* Session Token Display */}
            <div className="overflow-x-auto">
              {/* Desktop */}
              <div className="hidden sm:block" style={{ color: '#bba7c0' }}>
                <pre className="text-xs leading-tight">
{`╔═════════════════════════════════════════════════════════════════════════════╗
║  ACTIVE SESSION                                                  [REVOKE]   ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║  TOKEN: va_sess_xK7m9pL2qR4tN8vB3cD6fH1jW5yZ0aE4gI7kM2oP9rS1uV6xY3zA      ║
║                                                                             ║
║  AGENT:   claude-code                                                       ║
║  EXPIRES: 58 minutes remaining                                              ║
║  SECRETS: OPENAI_API_KEY, DATABASE_URL                                      ║
║                                                                             ║
║  STATUS:  [====================================          ] 58%              ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝`}
                </pre>
              </div>
              {/* Mobile */}
              <div className="sm:hidden p-4 border space-y-3" style={{ borderColor: '#bba7c0', color: '#bba7c0' }}>
                <div className="flex justify-between items-center text-xs">
                  <span>ACTIVE SESSION</span>
                  <span>[REVOKE]</span>
                </div>
                <div className="text-xs space-y-2" style={{ color: '#e8e3e3' }}>
                  <div><span style={{ color: '#5f5d64' }}>AGENT:</span> claude-code</div>
                  <div><span style={{ color: '#5f5d64' }}>EXPIRES:</span> 58 min</div>
                  <div><span style={{ color: '#5f5d64' }}>SECRETS:</span> OPENAI_API_KEY, DATABASE_URL</div>
                </div>
                <div className="h-2 border" style={{ borderColor: '#bba7c0' }}>
                  <div className="h-full" style={{ width: '58%', backgroundColor: '#bba7c0' }}></div>
                </div>
              </div>
            </div>

            {/* Create Session Button */}
            <div className="flex justify-center">
              <button
                className="transition-all hover-highlight w-full sm:w-auto"
                style={{ color: '#a8d8b9' }}
              >
                <pre className="hidden sm:block text-xs leading-tight">
{`┌─────────────────────────┐
│  [>] CREATE SESSION     │
└─────────────────────────┘`}
                </pre>
                <div className="sm:hidden py-3 px-6 border text-xs text-center" style={{ borderColor: '#a8d8b9' }}>
                  [&gt;] CREATE SESSION
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    AUDIT LOG TAB                        */}
        {/* ═══════════════════════════════════════════════════════ */}

        {activeTab === 2 && (
          <div className="overflow-x-auto">
            <div style={{ color: '#a8d8b9', minWidth: '320px' }}>
              <pre className="hidden sm:block text-xs">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│  AUDIT LOG                                                      [EXPORT]    │
├─────────────────────────────────────────────────────────────────────────────┤`}
              </pre>
              <div className="sm:hidden flex justify-between items-center p-3 border border-b-0" style={{ borderColor: '#a8d8b9' }}>
                <span className="text-xs">AUDIT LOG</span>
                <span className="text-xs">[EXPORT]</span>
              </div>

              <div
                className="px-3 sm:px-4 py-2 border-l border-r"
                style={{ borderColor: '#a8d8b9' }}
              >
                {auditLog.map((log, i) => (
                  <div
                    key={i}
                    className="py-2 text-xs border-b"
                    style={{ borderColor: '#2a2a2e' }}
                  >
                    {/* Desktop */}
                    <div className="hidden sm:flex items-center gap-4">
                      <span style={{ color: '#5f5d64' }}>{log.time}</span>
                      <span style={{
                        color: log.action === 'SESSION_CREATE' ? '#a8d8b9' :
                               log.action === 'SECRET_ACCESS' ? '#adb7ac' :
                               '#eb6f92'
                      }}>
                        [{log.action}]
                      </span>
                      <span style={{ color: '#bba7c0' }}>{log.agent}</span>
                      <span style={{ color: '#5f5d64' }}>{log.secrets.join(', ')}</span>
                    </div>
                    {/* Mobile */}
                    <div className="sm:hidden space-y-1">
                      <div className="flex justify-between items-center">
                        <span style={{
                          color: log.action === 'SESSION_CREATE' ? '#a8d8b9' :
                                 log.action === 'SECRET_ACCESS' ? '#adb7ac' :
                                 '#eb6f92'
                        }}>
                          [{log.action}]
                        </span>
                        <span style={{ color: '#5f5d64' }}>{log.time}</span>
                      </div>
                      <div className="flex gap-2">
                        <span style={{ color: '#bba7c0' }}>{log.agent}</span>
                        <span style={{ color: '#5f5d64' }}>{log.secrets.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <pre className="hidden sm:block text-xs">
{`└─────────────────────────────────────────────────────────────────────────────┘`}
              </pre>
              <div className="sm:hidden border-t" style={{ borderColor: '#a8d8b9' }}></div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                  HOW IT WORKS                           */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="space-y-3">
          <p className="text-xs text-center" style={{ color: '#5f5d64' }}>{`// HOW IT WORKS`}</p>

          {/* Desktop */}
          <div className="hidden lg:flex justify-center overflow-x-auto" style={{ color: '#adb7ac' }}>
            <pre className="text-xs leading-tight">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    YOU                    VAULTAGENT                    AI AGENT            │
│     │                         │                            │                │
│     │  1. Store secrets       │                            │                │
│     │  ─────────────────────> │  (encrypted client-side)   │                │
│     │                         │                            │                │
│     │  2. Create session      │                            │                │
│     │  ─────────────────────> │  (scoped, time-limited)    │                │
│     │                         │                            │                │
│     │                         │  3. Inject to env          │                │
│     │                         │  ─────────────────────────>│                │
│     │                         │                            │                │
│     │                         │     Agent uses secrets     │                │
│     │                         │     (never sees values)    │                │
│     │                         │                            │                │
│     │  4. Full audit log      │                            │                │
│     │  <───────────────────── │                            │                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>
          {/* Mobile */}
          <div className="lg:hidden p-4 border space-y-4" style={{ borderColor: '#5f5d64', color: '#adb7ac' }}>
            <div className="flex items-start gap-3">
              <span style={{ color: '#a8d8b9' }}>1.</span>
              <div>
                <p className="text-sm">Store secrets</p>
                <p className="text-xs" style={{ color: '#5f5d64' }}>encrypted client-side</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span style={{ color: '#a8d8b9' }}>2.</span>
              <div>
                <p className="text-sm">Create session</p>
                <p className="text-xs" style={{ color: '#5f5d64' }}>scoped, time-limited</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span style={{ color: '#a8d8b9' }}>3.</span>
              <div>
                <p className="text-sm">Agent uses secrets</p>
                <p className="text-xs" style={{ color: '#5f5d64' }}>never sees actual values</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span style={{ color: '#a8d8b9' }}>4.</span>
              <div>
                <p className="text-sm">Full audit log</p>
                <p className="text-xs" style={{ color: '#5f5d64' }}>track every access</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    FEATURES                             */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="space-y-3">
          <p className="text-xs text-center" style={{ color: '#5f5d64' }}>{`// FEATURES`}</p>

          {/* Desktop */}
          <div className="hidden sm:flex flex-col md:flex-row justify-center gap-4">
            <div style={{ color: '#a8d8b9' }} className="hover-brighten transition-all cursor-default">
              <pre className="text-xs leading-tight">
{`┌───────────────────────────┐
│                           │
│    [/] ZERO-KNOWLEDGE     │
│                           │
│  Secrets encrypted        │
│  client-side. Server      │
│  never sees plaintext.    │
│                           │
└───────────────────────────┘`}
              </pre>
            </div>

            <div style={{ color: '#bba7c0' }} className="hover-brighten transition-all cursor-default">
              <pre className="text-xs leading-tight">
{`┌───────────────────────────┐
│                           │
│    [~] SCOPED SESSIONS    │
│                           │
│  Time-limited access.     │
│  Agents only see what     │
│  you explicitly allow.    │
│                           │
└───────────────────────────┘`}
              </pre>
            </div>

            <div style={{ color: '#adb7ac' }} className="hover-brighten transition-all cursor-default">
              <pre className="text-xs leading-tight">
{`┌───────────────────────────┐
│                           │
│    [>] FULL AUDIT         │
│                           │
│  Know exactly what        │
│  was accessed, when,      │
│  and by which agent.      │
│                           │
└───────────────────────────┘`}
              </pre>
            </div>
          </div>

          {/* Mobile */}
          <div className="sm:hidden space-y-3">
            <div className="p-4 border" style={{ borderColor: '#a8d8b9', color: '#a8d8b9' }}>
              <div className="text-sm mb-2">[/] ZERO-KNOWLEDGE</div>
              <p className="text-xs" style={{ color: '#adb7ac' }}>Secrets encrypted client-side. Server never sees plaintext.</p>
            </div>
            <div className="p-4 border" style={{ borderColor: '#bba7c0', color: '#bba7c0' }}>
              <div className="text-sm mb-2">[~] SCOPED SESSIONS</div>
              <p className="text-xs" style={{ color: '#adb7ac' }}>Time-limited access. Agents only see what you explicitly allow.</p>
            </div>
            <div className="p-4 border" style={{ borderColor: '#adb7ac', color: '#adb7ac' }}>
              <div className="text-sm mb-2">[&gt;] FULL AUDIT</div>
              <p className="text-xs" style={{ color: '#adb7ac' }}>Know exactly what was accessed, when, and by which agent.</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    PRICING                              */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="space-y-3">
          <p className="text-xs text-center" style={{ color: '#5f5d64' }}>{`// PRICING`}</p>

          {/* Desktop */}
          <div className="hidden lg:flex flex-col md:flex-row justify-center gap-6">
            {/* Free Tier */}
            <div style={{ color: '#adb7ac' }}>
              <pre className="text-xs leading-tight">
{`┌─────────────────────────────────┐
│                                 │
│      ┌─────┐                    │
│      │  F  │   FREE             │
│      └─────┘                    │
│                                 │
│      $0/forever                 │
│                                 │
│      [/] 1 vault                │
│      [/] 10 secrets             │
│      [/] 50 sessions/day        │
│      [x] Audit export           │
│      [x] Team features          │
│                                 │
│     ┌─────────────────────┐     │
│     │   CURRENT PLAN      │     │
│     └─────────────────────┘     │
│                                 │
└─────────────────────────────────┘`}
              </pre>
            </div>

            {/* Pro Tier */}
            <div style={{ color: '#a8d8b9' }}>
              <pre className="text-xs leading-tight">
{`╔═════════════════════════════════╗
║   * * * RECOMMENDED * * *       ║
║                                 ║
║      ╔═════╗                    ║
║      ║ PRO ║   PRO              ║
║      ╚═════╝                    ║
║                                 ║
║      $9/month                   ║
║                                 ║
║      [/] 5 vaults               ║
║      [/] 100 secrets            ║
║      [/] Unlimited sessions     ║
║      [/] Audit export           ║
║      [x] Team features          ║
║                                 ║`}
              </pre>
              <Link href="/pricing" className="block hover-highlight transition-all">
                <pre className="text-xs leading-tight">
{`║     ╔═════════════════════╗     ║
║     ║  [>] UPGRADE NOW    ║     ║
║     ╚═════════════════════╝     ║`}
                </pre>
              </Link>
              <pre className="text-xs leading-tight">
{`║                                 ║
╚═════════════════════════════════╝`}
              </pre>
            </div>
          </div>

          {/* Mobile Pricing */}
          <div className="lg:hidden space-y-4">
            {/* Free */}
            <div className="p-4 border" style={{ borderColor: '#5f5d64', color: '#adb7ac' }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold">FREE</span>
                <span className="text-lg">$0</span>
              </div>
              <div className="space-y-1 text-xs mb-4">
                <div style={{ color: '#a8d8b9' }}>[/] 1 vault</div>
                <div style={{ color: '#a8d8b9' }}>[/] 10 secrets</div>
                <div style={{ color: '#a8d8b9' }}>[/] 50 sessions/day</div>
                <div style={{ color: '#5f5d64' }}>[x] Audit export</div>
              </div>
              <div className="text-center py-2 border text-xs" style={{ borderColor: '#5f5d64' }}>CURRENT PLAN</div>
            </div>
            {/* Pro */}
            <div className="p-4 border-2" style={{ borderColor: '#a8d8b9', color: '#a8d8b9' }}>
              <div className="text-xs text-center mb-2">* * * RECOMMENDED * * *</div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold">PRO</span>
                <span className="text-lg">$9/mo</span>
              </div>
              <div className="space-y-1 text-xs mb-4" style={{ color: '#e8e3e3' }}>
                <div style={{ color: '#a8d8b9' }}>[/] 5 vaults</div>
                <div style={{ color: '#a8d8b9' }}>[/] 100 secrets</div>
                <div style={{ color: '#a8d8b9' }}>[/] Unlimited sessions</div>
                <div style={{ color: '#a8d8b9' }}>[/] Audit export</div>
              </div>
              <Link href="/pricing" className="block text-center py-2 text-xs" style={{ backgroundColor: '#a8d8b9', color: '#141a17' }}>
                [&gt;] UPGRADE NOW
              </Link>
            </div>
          </div>

          {/* Team/Enterprise - Desktop */}
          <div className="hidden lg:flex justify-center">
            <div style={{ color: '#bba7c0' }}>
              <pre className="text-xs leading-tight">
{`╔═════════════════════════════════════════════════════════════════════════════╗
║  TEAM $29/mo                           ENTERPRISE $99/mo                    ║
║  ───────────                           ─────────────────                    ║
║  [/] 20 vaults                         [/] Unlimited vaults                 ║
║  [/] 500 secrets                       [/] Unlimited secrets                ║
║  [/] Team sharing                      [/] SSO integration                  ║
║  [/] Role-based access                 [/] Compliance reports               ║
║                                                                             ║`}
              </pre>
              <Link href="/pricing" className="block hover-highlight transition-all">
                <pre className="text-xs leading-tight">
{`║                           [>] SEE PRICING                                   ║`}
                </pre>
              </Link>
              <pre className="text-xs leading-tight">
{`╚═════════════════════════════════════════════════════════════════════════════╝`}
              </pre>
            </div>
          </div>

          {/* Team/Enterprise - Mobile */}
          <div className="lg:hidden">
            <Link href="/pricing" className="block text-center py-3 border text-xs" style={{ borderColor: '#bba7c0', color: '#bba7c0' }}>
              [&gt;] SEE ALL PLANS (Team $29/mo, Enterprise $99/mo)
            </Link>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                  INTEGRATIONS                           */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="space-y-3">
          <p className="text-xs text-center" style={{ color: '#5f5d64' }}>{`// INTEGRATIONS`}</p>

          {/* Desktop */}
          <div className="hidden md:flex justify-center overflow-x-auto" style={{ color: '#adb7ac' }}>
            <pre className="text-xs leading-tight">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  [/] CLAUDE CODE     [/] CURSOR      [~] COPILOT      [~] WINDSURF          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  $ npx vaultagent init                                                      │
│  $ vaultagent add OPENAI_API_KEY                                            │
│  $ vaultagent session create --agent claude-code --duration 1h              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>

          {/* Mobile */}
          <div className="md:hidden p-4 border space-y-4" style={{ borderColor: '#5f5d64', color: '#adb7ac' }}>
            <div className="grid grid-cols-2 gap-2 text-xs text-center">
              <div className="p-2 border" style={{ borderColor: '#a8d8b9', color: '#a8d8b9' }}>CLAUDE CODE [/]</div>
              <div className="p-2 border" style={{ borderColor: '#a8d8b9', color: '#a8d8b9' }}>CURSOR [/]</div>
              <div className="p-2 border" style={{ borderColor: '#5f5d64', color: '#5f5d64' }}>COPILOT [~]</div>
              <div className="p-2 border" style={{ borderColor: '#5f5d64', color: '#5f5d64' }}>WINDSURF [~]</div>
            </div>
            <div className="text-xs space-y-1 p-3" style={{ backgroundColor: '#1a211d' }}>
              <div>$ npx vaultagent init</div>
              <div>$ vaultagent add OPENAI_API_KEY</div>
              <div className="break-all">$ vaultagent session create --agent claude-code</div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    THREAT MODEL                         */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="space-y-3">
          <p className="text-xs text-center" style={{ color: '#5f5d64' }}>{`// THREAT MODEL`}</p>

          {/* Desktop */}
          <div className="hidden lg:flex justify-center overflow-x-auto">
            <pre className="text-xs leading-tight" style={{ color: '#adb7ac' }}
              dangerouslySetInnerHTML={{ __html:
`┌─────────────────────────────────────────────────────────────────────────────┐
│  <span style="color:#eb6f92">WITHOUT VAULTAGENT</span>                    <span style="color:#a8d8b9">WITH VAULTAGENT</span>                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  <span style="color:#eb6f92">[!] API keys in .env files</span>            <span style="color:#a8d8b9">[/] Keys encrypted client-side</span>       │
│      <span style="color:#5f5d64">Risk: leaked in git, logs</span>             <span style="color:#5f5d64">Never stored in plaintext</span>        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  <span style="color:#eb6f92">[!] Agent has permanent access</span>        <span style="color:#a8d8b9">[/] Time-scoped sessions</span>             │
│      <span style="color:#5f5d64">Risk: compromised agent =</span>             <span style="color:#5f5d64">Access auto-revokes</span>              │
│      <span style="color:#5f5d64">compromised secrets forever</span>           <span style="color:#5f5d64">Blast radius contained</span>           │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  <span style="color:#eb6f92">[!] No visibility into usage</span>          <span style="color:#a8d8b9">[/] Full audit trail</span>                 │
│      <span style="color:#5f5d64">Risk: can&#39;t detect misuse</span>             <span style="color:#5f5d64">Every access logged</span>              │
│      <span style="color:#5f5d64">or prove compliance</span>                   <span style="color:#5f5d64">Exportable for audits</span>            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘` }} />
          </div>

          {/* Mobile */}
          <div className="lg:hidden space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 border text-xs" style={{ borderColor: '#eb6f92', color: '#eb6f92' }}>
                <div className="mb-2">[!] WITHOUT</div>
                <p style={{ color: '#5f5d64' }}>Keys in .env files</p>
              </div>
              <div className="p-3 border text-xs" style={{ borderColor: '#a8d8b9', color: '#a8d8b9' }}>
                <div className="mb-2">[/] WITH</div>
                <p style={{ color: '#adb7ac' }}>Encrypted client-side</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 border text-xs" style={{ borderColor: '#eb6f92', color: '#eb6f92' }}>
                <div className="mb-2">[!] WITHOUT</div>
                <p style={{ color: '#5f5d64' }}>Permanent agent access</p>
              </div>
              <div className="p-3 border text-xs" style={{ borderColor: '#a8d8b9', color: '#a8d8b9' }}>
                <div className="mb-2">[/] WITH</div>
                <p style={{ color: '#adb7ac' }}>Time-scoped sessions</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 border text-xs" style={{ borderColor: '#eb6f92', color: '#eb6f92' }}>
                <div className="mb-2">[!] WITHOUT</div>
                <p style={{ color: '#5f5d64' }}>No usage visibility</p>
              </div>
              <div className="p-3 border text-xs" style={{ borderColor: '#a8d8b9', color: '#a8d8b9' }}>
                <div className="mb-2">[/] WITH</div>
                <p style={{ color: '#adb7ac' }}>Full audit trail</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                      FAQ                                */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="space-y-3">
          <p className="text-xs text-center" style={{ color: '#5f5d64' }}>{`// FAQ`}</p>

          <div className="flex justify-center">
            <div className="space-y-2" style={{ color: '#adb7ac' }}>
            <details className="group">
              <summary className="cursor-pointer" style={{ color: '#a8d8b9' }}>
                <pre className="text-xs inline">
{`[?] Can VaultAgent access my plaintext secrets?`}
                </pre>
              </summary>
              <pre className="text-xs pl-4 pt-2" style={{ color: '#adb7ac' }}>
{`    No. All encryption happens client-side with your master password.
    We only store encrypted blobs that we cannot decrypt.`}
              </pre>
            </details>

            <details className="group">
              <summary className="cursor-pointer" style={{ color: '#a8d8b9' }}>
                <pre className="text-xs inline">
{`[?] What happens when a session expires?`}
                </pre>
              </summary>
              <pre className="text-xs pl-4 pt-2" style={{ color: '#adb7ac' }}>
{`    The environment variables are automatically cleaned up.
    The agent loses access immediately with no manual intervention.`}
              </pre>
            </details>

            <details className="group">
              <summary className="cursor-pointer" style={{ color: '#a8d8b9' }}>
                <pre className="text-xs inline">
{`[?] Which AI coding agents are supported?`}
                </pre>
              </summary>
              <pre className="text-xs pl-4 pt-2" style={{ color: '#adb7ac' }}>
{`    Currently Claude Code and Cursor. GitHub Copilot and Windsurf
    integrations are coming soon. Any agent that reads env vars works.`}
              </pre>
            </details>
            </div>
          </div>
        </div>

      </main>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*                      FOOTER                             */}
      {/* ═══════════════════════════════════════════════════════ */}

      <footer className="border-t mt-12 sm:mt-16" style={{ borderColor: '#5f5d64' }}>
        <div className="px-4 py-6 sm:py-8 flex justify-center">
          <div className="text-xs w-full" style={{ color: '#5f5d64', textAlign: 'center' }}>
            <pre className="hidden sm:block" style={{ margin: 0, overflow: 'visible', textAlign: 'center' }}>════════════════════════════════════════════════════════════════════════════════</pre>
            <div className="sm:hidden border-t mb-4" style={{ borderColor: '#5f5d64' }}></div>
            <div style={{ margin: '16px 0' }}>
              <div>SECURED WITH &lt;3 IN THE TERMINAL</div>
              <div style={{ marginTop: '16px' }}>(c) 2025 VAULTAGENT</div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4" style={{ fontFamily: 'inherit', marginTop: '16px', marginBottom: '16px' }}>
              <Link href="/" className="hover:text-[#a8d8b9] hover-text-glow transition-all">[HOME]</Link>
              <Link href="/docs" className="hover:text-[#a8d8b9] hover-text-glow transition-all">[DOCS]</Link>
              <Link href="/pricing" className="hover:text-[#a8d8b9] hover-text-glow transition-all">[PRICING]</Link>
              <a href="https://github.com/skygkruger" target="_blank" rel="noopener noreferrer" className="hover:text-[#a8d8b9] hover-text-glow transition-all">[GITHUB]</a>
              <a href="https://x.com/run_veridian" target="_blank" rel="noopener noreferrer" className="hover:text-[#a8d8b9] hover-text-glow transition-all">[X]</a>
              <a href="mailto:sky@veridian.run" className="hover:text-[#a8d8b9] hover-text-glow transition-all">[CONTACT]</a>
            </div>
            <pre className="hidden sm:block" style={{ margin: 0, overflow: 'visible', textAlign: 'center' }}>════════════════════════════════════════════════════════════════════════════════</pre>
            <div className="sm:hidden border-t mt-4" style={{ borderColor: '#5f5d64' }}></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
