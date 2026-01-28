-- ═══════════════════════════════════════════════════════════════
--  VAULTAGENT - MIGRATION 003
--  Hash session tokens for security
--  Plaintext tokens are never stored after this migration.
--  Run this in your Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Enable pgcrypto for SHA-256 hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Add token_hash column
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS token_hash TEXT;

-- Step 3: Hash all existing plaintext tokens
UPDATE public.sessions
SET token_hash = encode(digest(token, 'sha256'), 'hex')
WHERE token_hash IS NULL AND token IS NOT NULL;

-- Step 4: Make token_hash NOT NULL and add unique index
ALTER TABLE public.sessions ALTER COLUMN token_hash SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token_hash ON public.sessions(token_hash);

-- Step 5: Drop the plaintext token column
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_token_key;
ALTER TABLE public.sessions DROP COLUMN IF EXISTS token;
