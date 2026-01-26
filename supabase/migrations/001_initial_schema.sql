-- ═══════════════════════════════════════════════════════════════
--  VAULTAGENT - DATABASE SCHEMA
--  Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
--  USERS TABLE (extends Supabase auth.users)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'team', 'enterprise')),
  vault_limit INTEGER DEFAULT 1,
  secret_limit INTEGER DEFAULT 10,
  session_limit INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policy: users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════════
--  VAULTS TABLE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.vaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;

-- Vaults policy
CREATE POLICY "Users can manage own vaults" ON public.vaults
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
--  SECRETS TABLE
--  Note: encrypted_value is the AES-256-GCM encrypted blob
--  Server NEVER has access to the plaintext
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.secrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID NOT NULL REFERENCES public.vaults(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,  -- AES-256-GCM encrypted blob (base64)
  iv TEXT NOT NULL,               -- Initialization vector (base64)
  salt TEXT NOT NULL,             -- Key derivation salt (base64)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  
  UNIQUE(vault_id, name)
);

-- Enable RLS
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

-- Secrets policy
CREATE POLICY "Users can manage own secrets" ON public.secrets
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
--  SESSIONS TABLE
--  Time-limited, scoped access for AI agents
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id UUID NOT NULL REFERENCES public.vaults(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  allowed_secrets TEXT[] NOT NULL,  -- Array of secret names allowed in this session
  token TEXT NOT NULL UNIQUE,       -- Session token (hashed)
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,           -- NULL if active, timestamp if revoked
  
  -- Index for quick token lookup
  CONSTRAINT sessions_token_key UNIQUE (token)
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Sessions policy
CREATE POLICY "Users can manage own sessions" ON public.sessions
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
--  AUDIT LOG TABLE
--  Complete audit trail of all secret access
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN (
    'SECRET_CREATE',
    'SECRET_ACCESS',
    'SECRET_UPDATE',
    'SECRET_DELETE',
    'SESSION_CREATE',
    'SESSION_EXPIRE',
    'SESSION_REVOKE',
    'VAULT_CREATE',
    'VAULT_DELETE'
  )),
  target TEXT NOT NULL,             -- Name of secret/vault affected
  agent_name TEXT,                  -- Which agent performed the action
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs policy (read-only for users)
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
--  FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Create default vault
  INSERT INTO public.vaults (user_id, name, description)
  VALUES (NEW.id, 'Default', 'Your default secret vault');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to log secret access
CREATE OR REPLACE FUNCTION public.log_secret_access(
  p_user_id UUID,
  p_session_id UUID,
  p_secret_name TEXT,
  p_agent_name TEXT
)
RETURNS void AS $$
BEGIN
  -- Update last accessed timestamp
  UPDATE public.secrets
  SET last_accessed_at = NOW()
  WHERE user_id = p_user_id AND name = p_secret_name;
  
  -- Insert audit log
  INSERT INTO public.audit_logs (user_id, session_id, action, target, agent_name)
  VALUES (p_user_id, p_session_id, 'SECRET_ACCESS', p_secret_name, p_agent_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old sessions (run via cron)
CREATE OR REPLACE FUNCTION public.expire_sessions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE public.sessions
    SET revoked_at = NOW()
    WHERE expires_at < NOW()
      AND revoked_at IS NULL
    RETURNING id, user_id, agent_name
  )
  INSERT INTO public.audit_logs (user_id, session_id, action, target, agent_name)
  SELECT user_id, id, 'SESSION_EXPIRE', 'session', agent_name
  FROM expired;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
--  INDEXES
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_secrets_user_id ON public.secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_secrets_vault_id ON public.secrets(vault_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ═══════════════════════════════════════════════════════════════
--  GRANTS
-- ═══════════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
