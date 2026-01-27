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
        backgroundColor: '#1a1a2e',
        color: '#a8b2c3'
      }}
    >
      {/* ═══════════════════════════════════════════════════════ */}
      {/*                       HEADER                            */}
      {/* ═══════════════════════════════════════════════════════ */}

      <header className="border-b" style={{ borderColor: '#6e6a86' }}>
        <div className="flex justify-between items-center px-4">
          <div className="text-xs py-2" style={{ color: '#a8d8b9' }}>
            <pre style={{ margin: 0, overflow: 'visible' }}>╔════════════════════════════════════════════════════════════════════════════════╗</pre>
            <div style={{ display: 'flex', fontFamily: 'inherit', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>║  VAULTAGENT</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href="/docs" className="hover:underline">[DOCS]</Link>
                <Link href="/pricing" className="hover:underline">[PRICING]</Link>
                <a href="https://github.com/skygkruger" target="_blank" rel="noopener noreferrer" className="hover:underline">[GITHUB]</a>
                <a href="https://x.com/run_veridian" target="_blank" rel="noopener noreferrer" className="hover:underline">[@]</a>
                <span>  ║</span>
              </div>
            </div>
            <pre style={{ margin: 0, overflow: 'visible' }}>╚════════════════════════════════════════════════════════════════════════════════╝</pre>
          </div>
          <Link
            href="/auth/sign-in"
            className="text-sm font-bold px-4 py-2 transition-all hover:opacity-80"
            style={{
              color: '#1a1a2e',
              backgroundColor: '#a8d8b9',
              marginLeft: '24px'
            }}
          >
            LOGIN
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                     ASCII LOGO                          */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="flex flex-col items-center" style={{ color: '#a8d8b9' }}>
          <pre style={{
            fontSize: '16px',
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
          <pre style={{
            fontSize: '12px',
            lineHeight: 1.05,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            textAlign: 'left',
            color: '#a8d8b9',
            marginTop: '8px',
            padding: 0,
            border: 'none',
            background: 'none',
            overflow: 'visible'
          }}>
{`┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│ A ├─┤ G ├─┤ E ├─┤ N ├─┤ T │
└───┘ └───┘ └───┘ └───┘ └───┘`}
          </pre>
          <p className="text-xs tracking-widest mt-4" style={{ color: '#c4a7e7' }}>
            ·:·:· SECURE SECRET MANAGEMENT v1.0 ·:·:·
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                      TAGLINE                            */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="text-center space-y-2">
          <p style={{ color: '#e8e3e3' }}>
            AI agents need secrets. They shouldn&apos;t see them.
          </p>
          <p className="text-xs" style={{ color: '#6e6a86' }}>
            {`// zero-knowledge encryption, scoped sessions, full audit trails`}
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    TAB NAVIGATION                       */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="flex justify-center">
          <div style={{ color: '#a8d8b9' }}>
            <pre className="text-xs">
{`┌──────────────────┬──────────────────┬──────────────────┐`}
            </pre>
            <div className="flex border-l border-r" style={{ borderColor: '#a8d8b9' }}>
              {tabs.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  className="flex-1 text-center py-1 text-xs transition-colors"
                  style={{
                    color: activeTab === i ? '#a8d8b9' : '#6e6a86',
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
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    VAULT TAB                            */}
        {/* ═══════════════════════════════════════════════════════ */}

        {activeTab === 0 && (
          <div className="space-y-4">
            {/* Secret List */}
            <div className="flex justify-center">
              <div style={{ color: '#a8d8b9' }}>
                <pre className="text-xs">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│  YOUR SECRETS                                                      [+] ADD  │
├─────────────────────────────────────────────────────────────────────────────┤`}
              </pre>

              <div
                className="px-4 py-2 border-l border-r space-y-1"
                style={{ borderColor: '#a8d8b9' }}
              >
                {demoVault.map((secret, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 text-xs"
                    style={{
                      color: secret.status === 'active' ? '#e8e3e3' : '#6e6a86'
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span style={{ color: secret.status === 'active' ? '#a8d8b9' : '#eb6f92' }}>
                        {secret.status === 'active' ? '[/]' : '[x]'}
                      </span>
                      <span>{secret.name}</span>
                    </span>
                    <span className="flex items-center gap-4">
                      <span style={{ color: '#6e6a86' }}>{secret.masked}</span>
                      <span style={{ color: '#6e6a86' }}>{secret.lastAccessed}</span>
                    </span>
                  </div>
                ))}
              </div>

              <pre className="text-xs">
{`└─────────────────────────────────────────────────────────────────────────────┘`}
              </pre>
              </div>
            </div>

            {/* Add Secret Form */}
            <div className="flex justify-center">
              <div style={{ color: '#a8d8b9' }}>
              <pre className="text-xs">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│  ADD NEW SECRET                                                             │
├─────────────────────────────────────────────────────────────────────────────┤`}
              </pre>

              <div
                className="px-4 py-4 border-l border-r space-y-3"
                style={{ borderColor: '#a8d8b9' }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: '#6e6a86' }}>NAME:</span>
                  <span style={{ color: '#f2cdcd' }}>{'>'}</span>
                  <span
                    className="transition-opacity"
                    style={{
                      color: '#f2cdcd',
                      opacity: cursorVisible ? 1 : 0
                    }}
                  >█</span>
                  <input
                    value={secretName}
                    onChange={(e) => setSecretName(e.target.value)}
                    placeholder="OPENAI_API_KEY"
                    className="flex-1 bg-transparent outline-none text-xs"
                    style={{
                      color: '#e8e3e3',
                      caretColor: 'transparent',
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: '#6e6a86' }}>VALUE:</span>
                  <span style={{ color: '#f2cdcd' }}>{'>'}</span>
                  <input
                    type="password"
                    value={secretValue}
                    onChange={(e) => setSecretValue(e.target.value)}
                    placeholder="sk-xxxxxxxxxxxxxxxx"
                    className="flex-1 bg-transparent outline-none text-xs"
                    style={{
                      color: '#e8e3e3',
                      caretColor: '#f2cdcd',
                    }}
                  />
                </div>
              </div>

              <pre className="text-xs">
{`└─────────────────────────────────────────────────────────────────────────────┘`}
              </pre>
              </div>
            </div>

            {/* Create Button */}
            <div className="flex justify-center">
              <button
                onClick={handleCreateSecret}
                disabled={isCreating || !secretName.trim() || !secretValue.trim()}
                className="transition-all hover:translate-y-px disabled:opacity-50"
                style={{ color: '#a8d8b9' }}
              >
                <pre className="text-xs leading-tight">
{isCreating
  ? `┌─────────────────────────┐
│  [~] ENCRYPTING...      │
└─────────────────────────┘`
  : `┌─────────────────────────┐
│  [>] STORE SECRET       │
└─────────────────────────┘`}
                </pre>
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
            <div className="flex justify-center">
              <div style={{ color: '#e8e3e3' }}>
                <pre className="text-xs">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│  CREATE AGENT SESSION                                                       │
├─────────────────────────────────────────────────────────────────────────────┤`}
                </pre>

                <div
                  className="px-4 py-3 border-l border-r space-y-2"
                  style={{ borderColor: '#e8e3e3' }}
                >
                  <p className="text-xs" style={{ color: '#6e6a86' }}>{`// select session duration`}</p>
                  {durations.map((dur) => (
                    <button
                      key={dur.label}
                      onClick={() => setSessionDuration(dur.value)}
                      className="w-full text-left flex items-center gap-4 py-2 transition-all hover:translate-x-1"
                      style={{
                        color: sessionDuration === dur.value ? '#a8d8b9' : '#6e6a86'
                      }}
                    >
                      <span className="w-6">{sessionDuration === dur.value ? '[x]' : '[ ]'}</span>
                      <span className="w-16">{dur.label}</span>
                      <span className="text-xs" style={{ color: '#6e6a86' }}>{`// ${dur.desc}`}</span>
                    </button>
                  ))}
                </div>

                <pre className="text-xs">
{`├─────────────────────────────────────────────────────────────────────────────┤
│  SELECTED: ${String(sessionDuration).padEnd(2)} HOUR(S)                                                      │
└─────────────────────────────────────────────────────────────────────────────┘`}
                </pre>
              </div>
            </div>

            {/* Session Token Display */}
            <div className="flex justify-center">
              <div style={{ color: '#c4a7e7' }}>
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
            </div>

            {/* Create Session Button */}
            <div className="flex justify-center">
              <button
                className="transition-all hover:translate-y-px"
                style={{ color: '#a8d8b9' }}
              >
                <pre className="text-xs leading-tight">
{`┌─────────────────────────┐
│  [>] CREATE SESSION     │
└─────────────────────────┘`}
                </pre>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    AUDIT LOG TAB                        */}
        {/* ═══════════════════════════════════════════════════════ */}

        {activeTab === 2 && (
          <div className="flex justify-center">
            <div style={{ color: '#a8d8b9' }}>
              <pre className="text-xs">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│  AUDIT LOG                                                      [EXPORT]    │
├─────────────────────────────────────────────────────────────────────────────┤`}
              </pre>

              <div
                className="px-4 py-2 border-l border-r"
                style={{ borderColor: '#a8d8b9' }}
              >
                {auditLog.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 py-2 text-xs border-b"
                    style={{ borderColor: '#2a2a3e' }}
                  >
                    <span style={{ color: '#6e6a86' }}>{log.time}</span>
                    <span style={{
                      color: log.action === 'SESSION_CREATE' ? '#a8d8b9' :
                             log.action === 'SECRET_ACCESS' ? '#7eb8da' :
                             '#eb6f92'
                    }}>
                      [{log.action}]
                    </span>
                    <span style={{ color: '#c4a7e7' }}>{log.agent}</span>
                    <span style={{ color: '#6e6a86' }}>{log.secrets.join(', ')}</span>
                  </div>
                ))}
              </div>

              <pre className="text-xs">
{`└─────────────────────────────────────────────────────────────────────────────┘`}
              </pre>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                  HOW IT WORKS                           */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="space-y-3">
          <p className="text-xs text-center" style={{ color: '#6e6a86' }}>{`// HOW IT WORKS`}</p>

          <div className="flex justify-center" style={{ color: '#a8b2c3' }}>
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
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    FEATURES                             */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="space-y-3">
          <p className="text-xs text-center" style={{ color: '#6e6a86' }}>{`// FEATURES`}</p>

          <div className="flex flex-col md:flex-row justify-center gap-4">
            <div style={{ color: '#a8d8b9' }}>
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

            <div style={{ color: '#c4a7e7' }}>
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

            <div style={{ color: '#7eb8da' }}>
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
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    PRICING                              */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="space-y-3">
          <p className="text-xs text-center" style={{ color: '#6e6a86' }}>{`// PRICING`}</p>

          <div className="flex flex-col md:flex-row justify-center gap-6">
            {/* Free Tier */}
            <div style={{ color: '#a8b2c3' }}>
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
              <Link href="/pricing" className="block hover:opacity-80 transition-opacity">
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

          {/* Team/Enterprise */}
          <div className="flex justify-center">
            <div style={{ color: '#c4a7e7' }}>
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
              <Link href="/pricing" className="block hover:opacity-80 transition-opacity">
                <pre className="text-xs leading-tight">
{`║                           [>] SEE PRICING                                   ║`}
                </pre>
              </Link>
              <pre className="text-xs leading-tight">
{`╚═════════════════════════════════════════════════════════════════════════════╝`}
              </pre>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                  INTEGRATIONS                           */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="space-y-3">
          <p className="text-xs text-center" style={{ color: '#6e6a86' }}>{`// INTEGRATIONS`}</p>

          <div className="flex justify-center" style={{ color: '#a8b2c3' }}>
            <pre className="text-xs leading-tight" style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace', overflow: 'visible' }}>
{`+------------------------------------------------------------------------+
|                                                                        |
|  +-----------+ +-----------+ +-----------+ +-----------+               |
|  |CLAUDE CODE| |  CURSOR   | |  COPILOT  | | WINDSURF  |               |
|  |   [/]     | |   [/]     | | [~] soon  | | [~] soon  |               |
|  +-----------+ +-----------+ +-----------+ +-----------+               |
|                                                                        |
|  $ npx vaultagent init                                                 |
|  $ vaultagent add OPENAI_API_KEY                                       |
|  $ vaultagent session create --agent claude-code --duration 1h         |
|                                                                        |
+------------------------------------------------------------------------+`}
            </pre>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    TESTIMONIALS                         */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="space-y-3">
          <p className="text-xs text-center" style={{ color: '#6e6a86' }}>{`// WHAT DEVELOPERS SAY`}</p>

          <div className="flex justify-center" style={{ color: '#a8b2c3' }}>
            <pre className="text-xs leading-tight">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  "Finally I can use Claude Code without worrying about my API keys          │
│   ending up in git history."                                 - @dev_anon    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  "The audit log saved us during a security review. We could show            │
│   exactly when each secret was accessed."                   - CTO at YC co  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  "Session expiry is genius. Even if the agent goes rogue,                   │
│   access automatically revokes."                          - HN commenter    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                      FAQ                                */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="space-y-3">
          <p className="text-xs text-center" style={{ color: '#6e6a86' }}>{`// FAQ`}</p>

          <div className="flex justify-center">
            <div className="space-y-2" style={{ color: '#a8b2c3' }}>
            <details className="group">
              <summary className="cursor-pointer" style={{ color: '#a8d8b9' }}>
                <pre className="text-xs inline">
{`[?] Can VaultAgent access my plaintext secrets?`}
                </pre>
              </summary>
              <pre className="text-xs pl-4 pt-2" style={{ color: '#a8b2c3' }}>
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
              <pre className="text-xs pl-4 pt-2" style={{ color: '#a8b2c3' }}>
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
              <pre className="text-xs pl-4 pt-2" style={{ color: '#a8b2c3' }}>
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

      <footer className="border-t mt-16" style={{ borderColor: '#6e6a86' }}>
        <div className="px-4 py-8 flex justify-center">
          <div className="text-xs" style={{ color: '#6e6a86', textAlign: 'center' }}>
            <pre style={{ margin: 0, overflow: 'visible', textAlign: 'center' }}>════════════════════════════════════════════════════════════════════════════════</pre>
            <div style={{ margin: '16px 0' }}>
              <div>SECURED WITH &lt;3 IN THE TERMINAL</div>
              <div style={{ marginTop: '16px' }}>(c) 2025 VAULTAGENT</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontFamily: 'inherit', marginTop: '16px', marginBottom: '16px' }}>
              <Link href="/" className="hover:text-[#a8d8b9] transition-colors">[HOME]</Link>
              <Link href="/docs" className="hover:text-[#a8d8b9] transition-colors">[DOCS]</Link>
              <Link href="/pricing" className="hover:text-[#a8d8b9] transition-colors">[PRICING]</Link>
              <a href="https://github.com/skygkruger" target="_blank" rel="noopener noreferrer" className="hover:text-[#a8d8b9] transition-colors">[GITHUB]</a>
              <a href="https://x.com/run_veridian" target="_blank" rel="noopener noreferrer" className="hover:text-[#a8d8b9] transition-colors">[X]</a>
              <a href="mailto:sky@veridian.run" className="hover:text-[#a8d8b9] transition-colors">[CONTACT]</a>
            </div>
            <pre style={{ margin: 0, overflow: 'visible', textAlign: 'center' }}>════════════════════════════════════════════════════════════════════════════════</pre>
          </div>
        </div>
      </footer>
    </div>
  );
}
