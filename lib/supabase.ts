import { createBrowserClient } from '@supabase/ssr'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - SUPABASE CLIENT
//  Browser-side client for authentication and data operations
// ═══════════════════════════════════════════════════════════════

// Provide fallback values for build time (won't be used at runtime)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Types for VaultAgent data structures
export interface Secret {
  id: string
  user_id: string
  vault_id: string
  name: string
  encrypted_value: string  // AES-256-GCM encrypted blob
  iv: string               // Initialization vector
  salt: string             // For key derivation
  created_at: string
  updated_at: string
  last_accessed_at: string | null
}

export interface Vault {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  secret_count: number
}

export interface Session {
  id: string
  user_id: string
  vault_id: string
  agent_name: string
  allowed_secrets: string[]  // Array of secret names
  token: string
  expires_at: string
  created_at: string
  revoked_at: string | null
}

export interface AuditLog {
  id: string
  user_id: string
  session_id: string | null
  action: 'SECRET_CREATE' | 'SECRET_ACCESS' | 'SECRET_DELETE' | 'SESSION_CREATE' | 'SESSION_EXPIRE' | 'SESSION_REVOKE'
  target: string
  agent_name: string | null
  ip_address: string | null
  created_at: string
}
