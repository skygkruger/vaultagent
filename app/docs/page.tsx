'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - DOCUMENTATION PAGE
//  Pastel Retro Terminal Design
// ═══════════════════════════════════════════════════════════════

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const colors = {
    bg: '#1a1a2e',
    bgLight: '#252542',
    text: '#e8e3e3',
    muted: '#5f5d64',
    mint: '#a8d8b9',
    lavender: '#bba7c0',
    coral: '#eb6f92',
    cyan: '#adb7ac',
  };

  const sections = [
    { id: 'getting-started', label: '[>] Getting Started' },
    { id: 'security', label: '[#] Security Model' },
    { id: 'features', label: '[+] Features' },
    { id: 'cli', label: '[/] CLI Reference' },
    { id: 'api', label: '[~] API Reference' },
    { id: 'faq', label: '[?] FAQ' },
  ];

  const Logo = () => (
    <div style={{ marginBottom: '8px', display: 'inline-block' }}>
      <div style={{
        color: colors.mint,
        fontSize: '22px',
        fontWeight: 'bold',
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        letterSpacing: '1px',
      }}>
        VAULTAGENT
      </div>
      <div style={{
        color: colors.muted,
        fontSize: '14px',
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        marginTop: '4px',
        textAlign: 'center',
      }}>
        ::  ::
      </div>
    </div>
  );

  const CodeBlock = ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div style={{
      background: colors.bg,
      border: `1px solid ${colors.muted}`,
      marginBottom: '16px',
    }}>
      {title && (
        <div style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${colors.muted}`,
          color: colors.muted,
          fontSize: '12px',
        }}>
          {title}
        </div>
      )}
      <pre style={{
        margin: 0,
        padding: '12px',
        color: colors.mint,
        fontSize: '13px',
        lineHeight: '1.5',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
      }}>
        {children}
      </pre>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div>
            <h2 style={{ color: colors.mint, marginTop: 0 }}>┌─ Getting Started ─┐</h2>

            <p style={{ color: colors.text, lineHeight: '1.7' }}>
              VaultAgent is a secure secret management system designed specifically for
              AI coding agents. Store your API keys, database credentials, and sensitive
              tokens with zero-knowledge encryption, then grant time-limited access to
              your AI tools without ever exposing the actual values.
            </p>

            <h3 style={{ color: colors.lavender }}>The Problem</h3>

            <p style={{ color: colors.text, lineHeight: '1.7' }}>
              AI coding agents like Claude Code, Cursor, and GitHub Copilot need access
              to your secrets to be truly useful. But giving agents direct access is risky:
            </p>

            <div style={{
              background: colors.bgLight,
              border: `1px solid ${colors.coral}`,
              padding: '16px',
              marginBottom: '16px',
            }}>
              <div style={{ color: colors.coral, marginBottom: '12px' }}>
                <span style={{ marginRight: '8px' }}>[!]</span> Secrets might appear in code suggestions
              </div>
              <div style={{ color: colors.coral, marginBottom: '12px' }}>
                <span style={{ marginRight: '8px' }}>[!]</span> Accidental logging exposes credentials
              </div>
              <div style={{ color: colors.coral }}>
                <span style={{ marginRight: '8px' }}>[!]</span> Keys could be sent to unexpected endpoints
              </div>
            </div>

            <h3 style={{ color: colors.lavender }}>The Solution</h3>

            <div style={{
              background: colors.bgLight,
              border: `1px solid ${colors.muted}`,
              padding: '16px',
              marginBottom: '16px',
            }}>
              <div style={{ color: colors.text, marginBottom: '12px' }}>
                <span style={{ color: colors.mint }}>[1]</span> Store secrets in your encrypted vault
              </div>
              <div style={{ color: colors.text, marginBottom: '12px' }}>
                <span style={{ color: colors.mint }}>[2]</span> Create a scoped, time-limited session
              </div>
              <div style={{ color: colors.text, marginBottom: '12px' }}>
                <span style={{ color: colors.mint }}>[3]</span> VaultAgent injects secrets to the environment
              </div>
              <div style={{ color: colors.text, marginBottom: '12px' }}>
                <span style={{ color: colors.mint }}>[4]</span> Agent uses secrets without seeing values
              </div>
              <div style={{ color: colors.text }}>
                <span style={{ color: colors.mint }}>[5]</span> Session expires automatically
              </div>
            </div>

            <h3 style={{ color: colors.lavender }}>Quick Start</h3>

            <CodeBlock title="terminal">
{`# Install the CLI
$ npm install -g vaultagent

# Initialize your vault
$ vaultagent init
[/] Vault initialized at ~/.vaultagent

# Add a secret
$ vaultagent add OPENAI_API_KEY
Enter value: ****************************
[/] Secret stored (encrypted)

# Create a session for your AI agent
$ vaultagent session create --agent claude-code --duration 1h
[/] Session created: va_sess_xK7m9pL2qR4tN8vB3cD6fH1j
[/] Secrets injected to environment
[/] Expires in 60 minutes`}
            </CodeBlock>

            <h3 style={{ color: colors.lavender }}>Supported AI Agents</h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              marginBottom: '16px',
            }}>
              {[
                { name: 'Claude Code', status: 'Supported', color: colors.mint },
                { name: 'Cursor', status: 'Supported', color: colors.mint },
                { name: 'GitHub Copilot', status: 'Coming Soon', color: colors.muted },
                { name: 'Windsurf', status: 'Coming Soon', color: colors.muted },
              ].map(agent => (
                <div key={agent.name} style={{
                  background: colors.bgLight,
                  border: `1px solid ${colors.muted}`,
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ color: colors.text }}>{agent.name}</span>
                  <span style={{ color: agent.color, fontSize: '12px' }}>
                    {agent.status === 'Supported' ? '[/]' : '[~]'} {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'security':
        return (
          <div>
            <h2 style={{ color: colors.mint, marginTop: 0 }}>┌─ Security Model ─┐</h2>

            <p style={{ color: colors.text, lineHeight: '1.7' }}>
              VaultAgent uses a zero-knowledge architecture. Your secrets are encrypted
              client-side before they ever leave your machine. Our servers store only
              encrypted blobs that we cannot decrypt.
            </p>

            <h3 style={{ color: colors.lavender }}>Zero-Knowledge Encryption</h3>

            <CodeBlock title="encryption flow">
{`┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   YOU                   CLIENT                   SERVER         │
│    │                       │                        │           │
│    │  Master password      │                        │           │
│    │  ───────────────────> │                        │           │
│    │                       │                        │           │
│    │                       │  Derive key (PBKDF2)   │           │
│    │                       │  ─────────────────>    │           │
│    │                       │                        │           │
│    │                       │  Encrypt (AES-256-GCM) │           │
│    │                       │  ─────────────────>    │           │
│    │                       │                        │           │
│    │                       │  Send encrypted blob   │           │
│    │                       │  ─────────────────────>│           │
│    │                       │                        │           │
│    │                       │           Store blob   │           │
│    │                       │           (can't read) │           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`}
            </CodeBlock>

            <h3 style={{ color: colors.lavender }}>Encryption Details</h3>

            <div style={{
              background: colors.bgLight,
              border: `1px solid ${colors.muted}`,
              padding: '16px',
              marginBottom: '16px',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '150px 1fr',
                gap: '12px',
                color: colors.text,
              }}>
                <div style={{ color: colors.muted }}>Algorithm:</div>
                <div>AES-256-GCM (authenticated encryption)</div>
                <div style={{ color: colors.muted }}>Key Derivation:</div>
                <div>PBKDF2 with SHA-256, 100,000 iterations</div>
                <div style={{ color: colors.muted }}>Salt:</div>
                <div>128-bit random per secret</div>
                <div style={{ color: colors.muted }}>IV/Nonce:</div>
                <div>96-bit random per encryption</div>
              </div>
            </div>

            <h3 style={{ color: colors.lavender }}>Session Security</h3>

            <p style={{ color: colors.text, lineHeight: '1.7' }}>
              Sessions are the core of VaultAgent&apos;s security model. Instead of giving
              agents permanent access to secrets, you create temporary, scoped sessions.
            </p>

            <CodeBlock title="session properties">
{`┌─────────────────────────────────────────────────────────────────┐
│  SESSION: va_sess_xK7m9pL2qR4tN8vB3cD6fH1jW5yZ0aE4gI7kM2oP    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AGENT:        claude-code                                      │
│  DURATION:     1 hour                                           │
│  SECRETS:      OPENAI_API_KEY, DATABASE_URL                     │
│  PERMISSIONS:  read-only                                        │
│                                                                 │
│  [/] Time-limited    - Auto-expires, no cleanup needed          │
│  [/] Scoped          - Only specified secrets accessible        │
│  [/] Audited         - Every access logged                      │
│  [/] Revocable       - Cancel anytime with 'session revoke'     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`}
            </CodeBlock>

            <h3 style={{ color: colors.lavender }}>What We Can&apos;t Do</h3>

            <div style={{
              background: colors.bgLight,
              border: `1px solid ${colors.mint}`,
              padding: '16px',
              marginBottom: '16px',
            }}>
              <div style={{ color: colors.mint, marginBottom: '12px' }}>
                <span style={{ marginRight: '8px' }}>[x]</span> Read your plaintext secrets
              </div>
              <div style={{ color: colors.mint, marginBottom: '12px' }}>
                <span style={{ marginRight: '8px' }}>[x]</span> Access your master password
              </div>
              <div style={{ color: colors.mint, marginBottom: '12px' }}>
                <span style={{ marginRight: '8px' }}>[x]</span> Decrypt your vault without your password
              </div>
              <div style={{ color: colors.mint }}>
                <span style={{ marginRight: '8px' }}>[x]</span> Recover your data if you lose your password
              </div>
            </div>

            <div style={{
              background: colors.bgLight,
              border: `1px solid ${colors.coral}`,
              padding: '16px',
            }}>
              <div style={{ color: colors.coral, marginBottom: '8px', fontSize: '13px' }}>
                [!] Important
              </div>
              <div style={{ color: colors.muted, fontSize: '12px', lineHeight: '1.5' }}>
                Your master password is the key to everything. If you lose it, we cannot
                help you recover your secrets. Store it safely.
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div>
            <h2 style={{ color: colors.mint, marginTop: 0 }}>┌─ Features ─┐</h2>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: colors.lavender }}>[&gt;] Encrypted Vaults</h3>
              <p style={{ color: colors.text, lineHeight: '1.7' }}>
                Organize your secrets into vaults. Each vault is independently encrypted
                and can contain unlimited secrets. Perfect for separating personal, work,
                and client projects.
              </p>
              <CodeBlock>
{`$ vaultagent vault create "client-acme"
[/] Vault 'client-acme' created

$ vaultagent vault list
┌────────────────┬──────────┬─────────────┐
│ VAULT          │ SECRETS  │ LAST ACCESS │
├────────────────┼──────────┼─────────────┤
│ default        │ 5        │ 2 min ago   │
│ client-acme    │ 0        │ never       │
│ side-projects  │ 12       │ 1 hour ago  │
└────────────────┴──────────┴─────────────┘`}
              </CodeBlock>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: colors.lavender }}>[&gt;] Scoped Sessions</h3>
              <p style={{ color: colors.text, lineHeight: '1.7' }}>
                Create time-limited sessions that grant access to specific secrets only.
                When the session expires, access is automatically revoked.
              </p>
              <CodeBlock>
{`$ vaultagent session create \\
    --agent cursor \\
    --duration 4h \\
    --secrets OPENAI_API_KEY,SUPABASE_URL

[/] Session created
[/] Token: va_sess_abc123...
[/] Expires: 4 hours
[/] Secrets: 2 of 5 accessible`}
              </CodeBlock>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: colors.lavender }}>[&gt;] Full Audit Log</h3>
              <p style={{ color: colors.text, lineHeight: '1.7' }}>
                Every secret access is logged with timestamp, agent name, and session ID.
                Know exactly what was accessed and when.
              </p>
              <CodeBlock>
{`$ vaultagent audit --last 10
┌──────────┬────────────────┬─────────────┬──────────────────┐
│ TIME     │ ACTION         │ AGENT       │ SECRET           │
├──────────┼────────────────┼─────────────┼──────────────────┤
│ 14:32:01 │ SESSION_CREATE │ claude-code │ -                │
│ 14:32:05 │ SECRET_ACCESS  │ claude-code │ OPENAI_API_KEY   │
│ 14:33:12 │ SECRET_ACCESS  │ claude-code │ DATABASE_URL     │
│ 14:47:22 │ SESSION_EXPIRE │ claude-code │ -                │
└──────────┴────────────────┴─────────────┴──────────────────┘`}
              </CodeBlock>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: colors.lavender, display: 'flex', alignItems: 'center', gap: '8px' }}>
                [&gt;] Team Sharing
                <span style={{
                  color: colors.bgLight,
                  background: colors.lavender,
                  padding: '2px 8px',
                  fontSize: '11px',
                }}>TEAM</span>
              </h3>
              <p style={{ color: colors.text, lineHeight: '1.7' }}>
                Share vaults with team members using role-based access control. Grant
                read-only or full access to specific vaults.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: colors.lavender, display: 'flex', alignItems: 'center', gap: '8px' }}>
                [&gt;] Audit Export
                <span style={{
                  color: colors.bgLight,
                  background: colors.lavender,
                  padding: '2px 8px',
                  fontSize: '11px',
                }}>TEAM</span>
              </h3>
              <p style={{ color: colors.text, lineHeight: '1.7' }}>
                Export audit logs for compliance reporting. Supports JSON and CSV formats.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: colors.lavender, display: 'flex', alignItems: 'center', gap: '8px' }}>
                [&gt;] SSO Integration
                <span style={{
                  color: colors.bgLight,
                  background: colors.coral,
                  padding: '2px 8px',
                  fontSize: '11px',
                }}>ENTERPRISE</span>
              </h3>
              <p style={{ color: colors.text, lineHeight: '1.7' }}>
                Integrate with your existing identity provider. Supports SAML 2.0 and OIDC.
              </p>
            </div>
          </div>
        );

      case 'cli':
        return (
          <div>
            <h2 style={{ color: colors.mint, marginTop: 0 }}>┌─ CLI Reference ─┐</h2>

            <h3 style={{ color: colors.lavender }}>Installation</h3>
            <CodeBlock title="terminal">
{`# npm
$ npm install -g vaultagent

# yarn
$ yarn global add vaultagent

# verify installation
$ vaultagent --version
vaultagent v1.0.0`}
            </CodeBlock>

            <h3 style={{ color: colors.lavender }}>Commands</h3>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: colors.mint }}>vaultagent init</h4>
              <p style={{ color: colors.muted, marginBottom: '8px' }}>Initialize a new vault</p>
              <CodeBlock>
{`$ vaultagent init
Enter master password: ********
Confirm password: ********
[/] Vault initialized at ~/.vaultagent`}
              </CodeBlock>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: colors.mint }}>vaultagent add [name]</h4>
              <p style={{ color: colors.muted, marginBottom: '8px' }}>Add a secret to your vault</p>
              <CodeBlock>
{`$ vaultagent add OPENAI_API_KEY
Enter value: ****************************
[/] Secret 'OPENAI_API_KEY' stored

# Or pipe from stdin
$ echo "sk-xxx" | vaultagent add OPENAI_API_KEY --stdin`}
              </CodeBlock>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: colors.mint }}>vaultagent list</h4>
              <p style={{ color: colors.muted, marginBottom: '8px' }}>List all secrets (names only)</p>
              <CodeBlock>
{`$ vaultagent list
┌──────────────────────┬─────────────────┬──────────────┐
│ NAME                 │ LAST ACCESSED   │ STATUS       │
├──────────────────────┼─────────────────┼──────────────┤
│ OPENAI_API_KEY       │ 5 min ago       │ [/] active   │
│ DATABASE_URL         │ 2 hours ago     │ [/] active   │
│ STRIPE_SECRET        │ 3 days ago      │ [x] expired  │
└──────────────────────┴─────────────────┴──────────────┘`}
              </CodeBlock>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: colors.mint }}>vaultagent session create</h4>
              <p style={{ color: colors.muted, marginBottom: '8px' }}>Create a new agent session</p>
              <CodeBlock>
{`$ vaultagent session create [options]

Options:
  --agent <name>       Agent name (claude-code, cursor, etc.)
  --duration <time>    Session duration (15m, 1h, 4h, 24h)
  --secrets <list>     Comma-separated secret names (optional)
  --vault <name>       Vault name (default: 'default')

Example:
$ vaultagent session create \\
    --agent claude-code \\
    --duration 1h \\
    --secrets OPENAI_API_KEY,DATABASE_URL`}
              </CodeBlock>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: colors.mint }}>vaultagent session revoke [id]</h4>
              <p style={{ color: colors.muted, marginBottom: '8px' }}>Revoke an active session immediately</p>
              <CodeBlock>
{`$ vaultagent session revoke va_sess_xK7m9pL2
[/] Session revoked
[/] Environment variables cleaned`}
              </CodeBlock>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: colors.mint }}>vaultagent audit</h4>
              <p style={{ color: colors.muted, marginBottom: '8px' }}>View audit log</p>
              <CodeBlock>
{`$ vaultagent audit [options]

Options:
  --last <n>           Show last n entries
  --since <date>       Show entries since date
  --agent <name>       Filter by agent
  --export <format>    Export as json or csv`}
              </CodeBlock>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: colors.mint }}>vaultagent remove [name]</h4>
              <p style={{ color: colors.muted, marginBottom: '8px' }}>Remove a secret from your vault</p>
              <CodeBlock>
{`$ vaultagent remove STRIPE_SECRET
Are you sure? This cannot be undone. [y/N] y
[/] Secret 'STRIPE_SECRET' removed`}
              </CodeBlock>
            </div>
          </div>
        );

      case 'api':
        return (
          <div>
            <h2 style={{ color: colors.mint, marginTop: 0 }}>┌─ API Reference ─┐</h2>

            <p style={{ color: colors.text, lineHeight: '1.7' }}>
              The VaultAgent API allows you to programmatically manage vaults, secrets,
              and sessions. All endpoints require authentication via API key.
            </p>

            <h3 style={{ color: colors.lavender }}>Authentication</h3>

            <CodeBlock title="request header">
{`Authorization: Bearer va_key_xxxxxxxxxxxxxxxxxxxxxxxx`}
            </CodeBlock>

            <h3 style={{ color: colors.lavender }}>Base URL</h3>

            <CodeBlock>
{`https://api.vaultagent.dev/v1`}
            </CodeBlock>

            <h3 style={{ color: colors.lavender }}>Endpoints</h3>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: colors.mint }}>POST /sessions</h4>
              <p style={{ color: colors.muted, marginBottom: '8px' }}>Create a new session</p>
              <CodeBlock title="request">
{`POST /v1/sessions
Content-Type: application/json

{
  "agent": "claude-code",
  "duration": 3600,
  "secrets": ["OPENAI_API_KEY", "DATABASE_URL"],
  "vault_id": "vault_abc123"
}`}
              </CodeBlock>
              <CodeBlock title="response">
{`{
  "id": "sess_xyz789",
  "token": "va_sess_xK7m9pL2qR4tN8vB3cD6fH1jW5yZ0aE4gI7k",
  "agent": "claude-code",
  "expires_at": "2025-01-26T15:30:00Z",
  "secrets": ["OPENAI_API_KEY", "DATABASE_URL"],
  "status": "active"
}`}
              </CodeBlock>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: colors.mint }}>DELETE /sessions/:id</h4>
              <p style={{ color: colors.muted, marginBottom: '8px' }}>Revoke a session</p>
              <CodeBlock title="request">
{`DELETE /v1/sessions/sess_xyz789`}
              </CodeBlock>
              <CodeBlock title="response">
{`{
  "id": "sess_xyz789",
  "status": "revoked",
  "revoked_at": "2025-01-26T14:45:00Z"
}`}
              </CodeBlock>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: colors.mint }}>GET /audit</h4>
              <p style={{ color: colors.muted, marginBottom: '8px' }}>Retrieve audit log entries</p>
              <CodeBlock title="request">
{`GET /v1/audit?limit=50&agent=claude-code`}
              </CodeBlock>
              <CodeBlock title="response">
{`{
  "entries": [
    {
      "id": "log_001",
      "timestamp": "2025-01-26T14:32:05Z",
      "action": "SECRET_ACCESS",
      "agent": "claude-code",
      "session_id": "sess_xyz789",
      "secret": "OPENAI_API_KEY"
    }
  ],
  "total": 127,
  "has_more": true
}`}
              </CodeBlock>
            </div>

            <h3 style={{ color: colors.lavender }}>Rate Limits</h3>
            <div style={{
              background: colors.bgLight,
              border: `1px solid ${colors.muted}`,
              padding: '16px',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                color: colors.text,
              }}>
                <div>Free tier:</div>
                <div style={{ color: colors.muted }}>50 requests/day</div>
                <div>Pro tier:</div>
                <div style={{ color: colors.mint }}>1,000 requests/day</div>
                <div>Team tier:</div>
                <div style={{ color: colors.lavender }}>10,000 requests/day</div>
                <div>Enterprise:</div>
                <div style={{ color: colors.cyan }}>Unlimited</div>
              </div>
            </div>
          </div>
        );

      case 'faq':
        return (
          <div>
            <h2 style={{ color: colors.mint, marginTop: 0 }}>┌─ FAQ ─┐</h2>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: colors.lavender }}>[?] Can VaultAgent access my plaintext secrets?</h3>
              <p style={{ color: colors.text, lineHeight: '1.7' }}>
                No. All encryption happens client-side using your master password. Our
                servers only store encrypted blobs that we cannot decrypt. Even if our
                database was compromised, your secrets would remain secure.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: colors.lavender }}>[?] What happens when a session expires?</h3>
              <p style={{ color: colors.text, lineHeight: '1.7' }}>
                The environment variables are automatically cleaned up and the session
                token becomes invalid. The AI agent immediately loses access to your
                secrets with no manual intervention required.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: colors.lavender }}>[?] Can the AI agent see my actual secret values?</h3>
              <p style={{ color: colors.text, lineHeight: '1.7' }}>
                The agent can use the secrets (e.g., make API calls) but cannot directly
                read or output the values. Secrets are injected into environment variables
                that the agent&apos;s runtime can access, but the values are never exposed in
                the agent&apos;s context window.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: colors.lavender }}>[?] What if I forget my master password?</h3>
              <p style={{ color: colors.text, lineHeight: '1.7' }}>
                Unfortunately, we cannot recover your vault if you forget your master
                password. This is by design - it&apos;s what makes the zero-knowledge
                architecture secure. We recommend using a password manager to store
                your master password.
              </p>
              <CodeBlock>
{`[!] Store your master password safely:
    - Password manager (1Password, Bitwarden)
    - Encrypted note
    - Physical backup in secure location`}
              </CodeBlock>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: colors.lavender }}>[?] Which AI agents are supported?</h3>
              <p style={{ color: colors.text, lineHeight: '1.7' }}>
                Currently we support Claude Code and Cursor with native integrations.
                GitHub Copilot and Windsurf support is coming soon. Any agent that reads
                environment variables can work with VaultAgent using the CLI.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: colors.lavender }}>[?] Is VaultAgent open source?</h3>
              <p style={{ color: colors.text, lineHeight: '1.7' }}>
                The CLI tool is open source and available on GitHub. You can audit the
                encryption implementation yourself. The server-side components are
                proprietary but the security model doesn&apos;t require you to trust us -
                all encryption happens client-side.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: colors.lavender }}>[?] How do I rotate a secret?</h3>
              <p style={{ color: colors.text, lineHeight: '1.7' }}>
                Simply update the secret with the same name. The old value is replaced
                and all active sessions using that secret will use the new value
                automatically.
              </p>
              <CodeBlock>
{`$ vaultagent update OPENAI_API_KEY
Enter new value: ****************************
[/] Secret 'OPENAI_API_KEY' updated
[/] 2 active sessions will use new value`}
              </CodeBlock>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: colors.lavender }}>[?] Can I self-host VaultAgent?</h3>
              <p style={{ color: colors.text, lineHeight: '1.7' }}>
                Enterprise customers can deploy VaultAgent on their own infrastructure.
                Contact us for self-hosted licensing options.
              </p>
            </div>

            <div style={{
              background: colors.bgLight,
              border: `1px solid ${colors.muted}`,
              padding: '16px',
              marginTop: '32px',
            }}>
              <div style={{ color: colors.muted, marginBottom: '8px' }}>
                Still have questions?
              </div>
              <div style={{ color: colors.text }}>
                Contact us at{' '}
                <span style={{ color: colors.mint }}>support@vaultagent.dev</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
      color: colors.text,
    }}>
      {/* Header */}
      <header style={{
        borderBottom: `1px solid ${colors.muted}`,
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ color: colors.mint, fontSize: '18px', textDecoration: 'none' }}>
            VaultAgent
          </Link>
          <span className="hidden sm:inline" style={{ color: colors.muted }}>|</span>
          <span className="hidden sm:inline" style={{ color: colors.muted }}>Documentation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <nav className="hidden md:flex" style={{ gap: '24px' }}>
            <Link href="/" style={{ color: colors.muted, textDecoration: 'none' }}>[~] Home</Link>
            <span style={{ color: colors.mint }}>[?] Docs</span>
            <Link href="/pricing" style={{ color: colors.muted, textDecoration: 'none' }}>[$] Pricing</Link>
          </nav>
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ color: colors.mint, fontSize: '12px' }}
          >
            {sidebarOpen ? '[x] CLOSE' : '[=] MENU'}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', position: 'relative' }}>
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
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          style={{
            width: '280px',
            flexShrink: 0,
            borderRight: `1px solid ${colors.muted}`,
            padding: '24px',
            minHeight: 'calc(100vh - 60px)',
            backgroundColor: colors.bg,
          }}
        >
          <Logo />

          {/* Mobile Nav Links */}
          <div className="lg:hidden" style={{ marginTop: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: `1px solid ${colors.muted}` }}>
            <Link href="/" style={{ display: 'block', color: colors.muted, textDecoration: 'none', padding: '8px 0', fontSize: '13px' }}>[~] Home</Link>
            <Link href="/pricing" style={{ display: 'block', color: colors.muted, textDecoration: 'none', padding: '8px 0', fontSize: '13px' }}>[$] Pricing</Link>
          </div>

          <div style={{ marginTop: '28px' }}>
            <div style={{ color: colors.muted, fontSize: '11px', marginBottom: '14px', letterSpacing: '1px' }}>
              DOCUMENTATION
            </div>

            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setSidebarOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 12px',
                  marginBottom: '4px',
                  background: activeSection === section.id ? colors.bgLight : 'transparent',
                  border: activeSection === section.id ? `1px solid ${colors.mint}` : '1px solid transparent',
                  color: activeSection === section.id ? colors.mint : colors.text,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                }}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div style={{
            marginTop: '28px',
            padding: '14px',
            background: colors.bgLight,
            border: `1px solid ${colors.muted}`,
          }}>
            <div style={{ color: colors.mint, marginBottom: '8px', fontSize: '12px' }}>
              [i] Security First
            </div>
            <div style={{ color: colors.muted, fontSize: '11px', lineHeight: '1.5' }}>
              Your master password never leaves your machine. All encryption
              happens client-side. We can&apos;t read your secrets even if we wanted to.
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          padding: '24px 16px',
        }}>
          <div style={{ maxWidth: '700px', width: '100%' }}>
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${colors.muted}`,
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        color: colors.muted,
        fontSize: '12px',
      }}>
        <span>VaultAgent v1.0.0</span>
        <span>Secrets secured with [/] zero-knowledge encryption</span>
      </footer>
    </div>
  );
}
