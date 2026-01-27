# VaultAgent

```
██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗
██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝
██║   ██║███████║██║   ██║██║     ██║   
╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║   
 ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║   
  ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   
         ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
         │ A ├─┤ G ├─┤ E ├─┤ N ├─┤ T │
         └───┘ └───┘ └───┘ └───┘ └───┘
```

**Secure Secret Management for AI Coding Agents**

AI agents need secrets. They shouldn't see them.

---

## The Problem

AI coding agents (Claude Code, Cursor, GitHub Copilot) need access to API keys, database credentials, and other secrets to be useful. But giving agents direct access to secrets is dangerous—they might:

- Include secrets in code suggestions
- Log them accidentally  
- Send them to unexpected places

## The Solution

VaultAgent acts as a secure middleman:

1. **Store** secrets in an encrypted vault
2. **Create** scoped, time-limited sessions for agents
3. **Inject** secrets into the environment temporarily
4. **Log** every access for audit trails
5. The agent **never "sees"** the actual secret values

---

## Features

| Feature | Description |
|---------|-------------|
| **Zero-Knowledge Encryption** | Secrets encrypted client-side. Server never sees plaintext. |
| **Scoped Sessions** | Agents only access specific secrets you allow |
| **Auto-Expiry** | Sessions expire automatically |
| **Full Audit Log** | Know exactly what was accessed and when |
| **CLI + Dashboard** | Use however you prefer |

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/vaultagent.git
cd vaultagent
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local`
3. Add your Supabase URL and anon key

### 3. Run the Database Migrations

```sql
-- Run this in your Supabase SQL Editor
-- See supabase/migrations/ for full schema
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
vaultagent/
├── app/                    # Next.js App Router
│   ├── globals.css         # Pastel Retro Terminal styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/             # React components
│   └── VaultAgentRetro.tsx # Main UI component
├── lib/                    # Utilities
│   ├── supabase.ts         # Supabase client
│   └── encryption.ts       # Client-side encryption
├── public/                 # Static assets
├── VaultAgent_Retro_Redesign.jsx  # Standalone UI showcase
└── package.json
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Encryption | AES-256-GCM (Web Crypto API) |
| Key Derivation | PBKDF2 with SHA-256 |
| Styling | Pastel Retro Terminal Design System |

---

## Design System

VaultAgent uses the **Pastel Retro Terminal** design system:

- **Primary Accent:** Mint `#a8d8b9`
- **Background:** Deep Navy `#1a1a2e`
- **Text:** Soft White `#e8e3e3`
- **Muted:** Dusty Purple `#6e6a86`
- **Pro Features:** Lavender `#c4a7e7`
- **Errors:** Coral `#eb6f92`

Box-drawing characters: `┌─┐└┘╔═╗╚╝`
ASCII icons: `[>] [x] [/] [~] [?]`
Monospace fonts only. No emojis.

---

## Pricing

| Tier | Vaults | Secrets | Sessions | Price |
|------|--------|---------|----------|-------|
| Free | 1 | 10 | 50/day | $0 |
| Pro | 5 | 100 | Unlimited | $9/mo |
| Team | 20 | 500 | + Audit Export | $29/mo |
| Enterprise | Unlimited | Unlimited | + SSO | $99/mo |

---

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/vaultagent)

### Manual

```bash
npm run build
npm run start
```

---

## License

MIT

---

## Part of the Pastel Retro Terminal Family

- [RegexGPT](https://regexgpt.com) - Pattern generation from natural language
- [PRoast](https://proast.dev) - Code reviews with adjustable savagery
- **VaultAgent** - Secure secret management for AI agents
- ShipLog - Automated changelog generation (coming soon)
- DeadCode Detective - Find and remove unused code (coming soon)

---

```
════════════════════════════════════════════════════════════════════════════════

                          SECURED WITH <3 IN THE TERMINAL

                               (c) 2025 VAULTAGENT

════════════════════════════════════════════════════════════════════════════════
```
# Trigger redeploy

