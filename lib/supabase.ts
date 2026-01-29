import { createBrowserClient } from '@supabase/ssr'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - SUPABASE CLIENT
//  Browser-side client for authentication and data operations
// ═══════════════════════════════════════════════════════════════

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

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
  token_hash: string
  expires_at: string
  created_at: string
  revoked_at: string | null
}

export interface AuditLog {
  id: string
  user_id: string
  session_id: string | null
  action: 'SECRET_CREATE' | 'SECRET_ACCESS' | 'SECRET_UPDATE' | 'SECRET_DELETE' | 'SESSION_CREATE' | 'SESSION_EXPIRE' | 'SESSION_REVOKE' | 'VAULT_CREATE' | 'VAULT_DELETE'
  target: string
  agent_name: string | null
  ip_address: string | null
  created_at: string
}
