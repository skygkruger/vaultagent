// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - TIER LIMITS
//  Shared tier configuration for client and server
// ═══════════════════════════════════════════════════════════════

export const TIER_LIMITS = {
  free: {
    vault_limit: 3,
    secret_limit: 25,
    session_limit: 50,
    audit_retention_days: 7,
    can_export_audit: false,
    can_share_vaults: false,
    has_api_access: false,
    has_sso: false,
  },
  pro: {
    vault_limit: 5,
    secret_limit: 100,
    session_limit: -1, // unlimited
    audit_retention_days: 30,
    can_export_audit: true,
    can_share_vaults: false,
    has_api_access: true,
    has_sso: false,
  },
  team: {
    vault_limit: 20,
    secret_limit: 500,
    session_limit: -1,
    audit_retention_days: 90,
    can_export_audit: true,
    can_share_vaults: true,
    has_api_access: true,
    has_sso: false,
  },
  enterprise: {
    vault_limit: -1, // unlimited
    secret_limit: -1,
    session_limit: -1,
    audit_retention_days: 365,
    can_export_audit: true,
    can_share_vaults: true,
    has_api_access: true,
    has_sso: true,
  },
}

export type Tier = keyof typeof TIER_LIMITS

export function getTierLimits(tier: string | undefined | null) {
  return TIER_LIMITS[(tier as Tier) || 'free'] || TIER_LIMITS.free
}
