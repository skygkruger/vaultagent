-- ═══════════════════════════════════════════════════════════════
--  VAULTAGENT - ADD STRIPE CUSTOMER ID TO PROFILES
--  Run this migration to support Stripe integration
-- ═══════════════════════════════════════════════════════════════

-- Add stripe_customer_id column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
ON public.profiles(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;
