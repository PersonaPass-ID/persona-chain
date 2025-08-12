// Supabase Configuration for PersonaPass Web3 Identity Storage
// Hybrid architecture with encrypted data storage

export interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

/**
 * Supabase configuration for different environments
 */
export const getSupabaseConfig = (): SupabaseConfig => {
  // For now, we'll use environment variables
  // In production, these should be properly configured
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  }
}

/**
 * Database schema for PersonaPass identity storage
 */
export interface IdentityRecord {
  id: string
  did: string
  wallet_address: string
  content_hash: string
  encrypted_content: string
  metadata: {
    type: string
    issuer: string
    created_at: string
    expires_at?: string
    schema_version: string
  }
  encryption_params: {
    iv: string
    salt: string
    algorithm: string
    key_derivation: string
  }
  created_at: string
  updated_at: string
}

export interface SessionRecord {
  id: string
  did: string
  wallet_address: string
  session_token_hash: string
  challenge_response: string
  signature_data: any
  expires_at: string
  is_active: boolean
  metadata: {
    ip_address?: string
    user_agent?: string
    login_method: string
  }
  created_at: string
}

export interface VerifiableCredentialRecord {
  id: string
  credential_id: string
  did: string
  content_hash: string
  encrypted_credential: string
  credential_type: string
  issuer_did: string
  subject_did: string
  issuance_date: string
  expiration_date?: string
  status: 'valid' | 'revoked' | 'suspended'
  encryption_params: {
    iv: string
    salt: string
    algorithm: string
  }
  blockchain_anchor: {
    tx_hash?: string
    block_height?: number
    network: string
  }
  created_at: string
  updated_at: string
}

export interface ZKProofRecord {
  id: string
  proof_id: string
  credential_id: string
  proof_type: string
  circuit_name: string
  encrypted_proof_data: string
  public_signals: any[]
  verification_key_id: string
  verification_status: 'pending' | 'verified' | 'failed'
  proof_purpose: string
  requested_attributes: string[]
  nullifier_hash?: string
  commitment_hash: string
  verifier_did?: string
  challenge_nonce: string
  expires_at: string
  created_at: string
}

/**
 * SQL schema for Supabase tables
 */
export const DATABASE_SCHEMA = `
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Identity Records Table
CREATE TABLE IF NOT EXISTS identity_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  did TEXT UNIQUE NOT NULL,
  wallet_address TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  encrypted_content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  encryption_params JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for fast lookups
  CONSTRAINT unique_did UNIQUE(did),
  CONSTRAINT unique_wallet_address UNIQUE(wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_identity_wallet_address ON identity_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_identity_did ON identity_records(did);
CREATE INDEX IF NOT EXISTS idx_identity_content_hash ON identity_records(content_hash);

-- Sessions Table
CREATE TABLE IF NOT EXISTS wallet_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  did TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  session_token_hash TEXT NOT NULL,
  challenge_response TEXT NOT NULL,
  signature_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key relationship
  FOREIGN KEY (did) REFERENCES identity_records(did) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_did ON wallet_sessions(did);
CREATE INDEX IF NOT EXISTS idx_sessions_wallet_address ON wallet_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON wallet_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON wallet_sessions(expires_at);

-- Verifiable Credentials Table
CREATE TABLE IF NOT EXISTS verifiable_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id TEXT UNIQUE NOT NULL,
  did TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  encrypted_credential TEXT NOT NULL,
  credential_type TEXT NOT NULL,
  issuer_did TEXT NOT NULL,
  subject_did TEXT NOT NULL,
  issuance_date TIMESTAMPTZ NOT NULL,
  expiration_date TIMESTAMPTZ,
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'revoked', 'suspended')),
  encryption_params JSONB NOT NULL,
  blockchain_anchor JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key relationship
  FOREIGN KEY (did) REFERENCES identity_records(did) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vc_credential_id ON verifiable_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_vc_did ON verifiable_credentials(did);
CREATE INDEX IF NOT EXISTS idx_vc_content_hash ON verifiable_credentials(content_hash);
CREATE INDEX IF NOT EXISTS idx_vc_type ON verifiable_credentials(credential_type);
CREATE INDEX IF NOT EXISTS idx_vc_status ON verifiable_credentials(status);
CREATE INDEX IF NOT EXISTS idx_vc_issuer ON verifiable_credentials(issuer_did);
CREATE INDEX IF NOT EXISTS idx_vc_subject ON verifiable_credentials(subject_did);

-- ZK Proofs Table
CREATE TABLE IF NOT EXISTS zk_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_id TEXT UNIQUE NOT NULL,
  credential_id TEXT NOT NULL,
  proof_type TEXT NOT NULL DEFAULT 'groth16',
  circuit_name TEXT NOT NULL,
  encrypted_proof_data TEXT NOT NULL,
  public_signals JSONB NOT NULL DEFAULT '[]',
  verification_key_id TEXT NOT NULL,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  proof_purpose TEXT NOT NULL,
  requested_attributes TEXT[] NOT NULL,
  nullifier_hash TEXT UNIQUE,
  commitment_hash TEXT NOT NULL,
  verifier_did TEXT,
  challenge_nonce TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key relationship
  FOREIGN KEY (credential_id) REFERENCES verifiable_credentials(credential_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_zkp_proof_id ON zk_proofs(proof_id);
CREATE INDEX IF NOT EXISTS idx_zkp_credential_id ON zk_proofs(credential_id);
CREATE INDEX IF NOT EXISTS idx_zkp_verification_status ON zk_proofs(verification_status);
CREATE INDEX IF NOT EXISTS idx_zkp_nullifier_hash ON zk_proofs(nullifier_hash);
CREATE INDEX IF NOT EXISTS idx_zkp_expires_at ON zk_proofs(expires_at);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_did TEXT,
  actor_wallet_address TEXT,
  actor_ip_address INET,
  event_data JSONB DEFAULT '{}',
  result TEXT NOT NULL CHECK (result IN ('success', 'failure', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_entity_type ON audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_actor_did ON audit_log(actor_did);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at);

-- Row Level Security Policies
ALTER TABLE identity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifiable_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE zk_proofs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can access own identity records" ON identity_records
  FOR ALL USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can access own sessions" ON wallet_sessions
  FOR ALL USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can access own credentials" ON verifiable_credentials
  FOR ALL USING (did = current_setting('app.current_did'));

CREATE POLICY "Users can access own proofs" ON zk_proofs
  FOR ALL USING (
    credential_id IN (
      SELECT credential_id FROM verifiable_credentials 
      WHERE did = current_setting('app.current_did')
    )
  );

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_identity_records_updated_at 
  BEFORE UPDATE ON identity_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verifiable_credentials_updated_at 
  BEFORE UPDATE ON verifiable_credentials 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;