import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VaultAgent - Secure Secret Management for AI Coding Agents',
  description: 'AI agents need secrets. They shouldn\'t see them. Zero-knowledge encryption, scoped sessions, and full audit trails.',
  keywords: ['secrets management', 'AI agents', 'Claude Code', 'Cursor', 'API keys', 'security', 'encryption'],
  authors: [{ name: 'VaultAgent' }],
  openGraph: {
    title: 'VaultAgent - Secure Secret Management for AI Coding Agents',
    description: 'AI agents need secrets. They shouldn\'t see them.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VaultAgent',
    description: 'Secure Secret Management for AI Coding Agents',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
