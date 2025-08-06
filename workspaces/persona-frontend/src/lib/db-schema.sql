-- PersonaPass Database Schema
-- Real storage for DIDs, Verifiable Credentials, and ZK Proofs

-- DIDs Table - Core identity storage
CREATE TABLE IF NOT EXISTS dids (
    id BIGSERIAL PRIMARY KEY,
    did VARCHAR(255) UNIQUE NOT NULL,
    wallet_address VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    wallet_type VARCHAR(50) NOT NULL,
    auth_method VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Blockchain tracking
    tx_hash VARCHAR(255),
    block_height BIGINT,
    blockchain_network VARCHAR(50) DEFAULT 'personachain-1',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Indexes for fast lookups
    INDEX idx_dids_wallet_address (wallet_address),
    INDEX idx_dids_did (did),
    INDEX idx_dids_created_at (created_at)
);

-- Verifiable Credentials Table - W3C compliant VC storage
CREATE TABLE IF NOT EXISTS verifiable_credentials (
    id BIGSERIAL PRIMARY KEY,
    credential_id VARCHAR(255) UNIQUE NOT NULL,
    did_id BIGINT NOT NULL REFERENCES dids(id) ON DELETE CASCADE,
    
    -- W3C VC Standard fields
    type VARCHAR(100) NOT NULL,
    issuer VARCHAR(255) NOT NULL,
    issuance_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiration_date TIMESTAMP WITH TIME ZONE,
    
    -- Credential Subject (the claims)
    subject_data JSONB NOT NULL,
    
    -- Cryptographic Proof
    proof_type VARCHAR(100) NOT NULL,
    proof_value TEXT NOT NULL,
    verification_method VARCHAR(255) NOT NULL,
    proof_purpose VARCHAR(100) NOT NULL,
    
    -- Status and metadata
    status VARCHAR(50) DEFAULT 'valid',
    revoked_at TIMESTAMP WITH TIME ZONE NULL,
    revocation_reason TEXT NULL,
    
    -- Blockchain anchoring
    blockchain_tx_hash VARCHAR(255),
    blockchain_block_height BIGINT,
    blockchain_network VARCHAR(50) DEFAULT 'personachain-1',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_vc_credential_id (credential_id),
    INDEX idx_vc_did_id (did_id),
    INDEX idx_vc_type (type),
    INDEX idx_vc_status (status),
    INDEX idx_vc_issuance_date (issuance_date)
);

-- ZK Proofs Table - Zero-Knowledge proof storage and verification
CREATE TABLE IF NOT EXISTS zk_proofs (
    id BIGSERIAL PRIMARY KEY,
    proof_id VARCHAR(255) UNIQUE NOT NULL,
    credential_id BIGINT NOT NULL REFERENCES verifiable_credentials(id) ON DELETE CASCADE,
    
    -- ZK Proof data
    proof_type VARCHAR(100) NOT NULL DEFAULT 'groth16',
    circuit_name VARCHAR(100) NOT NULL,
    proof_data JSONB NOT NULL, -- The actual ZK proof
    public_signals JSONB NOT NULL, -- Public inputs/outputs
    verification_key_id VARCHAR(255) NOT NULL,
    
    -- Verification status
    verification_status VARCHAR(50) DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE NULL,
    verification_result JSONB NULL,
    
    -- Proof context
    proof_purpose VARCHAR(100) NOT NULL, -- authentication, age_verification, etc.
    requested_attributes TEXT[] NOT NULL, -- which attributes were proven
    
    -- Privacy and security
    nullifier_hash VARCHAR(255) UNIQUE, -- Prevent double-spending/reuse
    commitment_hash VARCHAR(255) NOT NULL,
    
    -- Metadata
    verifier_did VARCHAR(255), -- Who requested/verified this proof
    challenge_nonce VARCHAR(255), -- Prevents replay attacks
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_zkp_proof_id (proof_id),
    INDEX idx_zkp_credential_id (credential_id),
    INDEX idx_zkp_circuit_name (circuit_name),
    INDEX idx_zkp_verification_status (verification_status),
    INDEX idx_zkp_nullifier_hash (nullifier_hash),
    INDEX idx_zkp_created_at (created_at)
);

-- Sessions Table - Secure wallet session management
CREATE TABLE IF NOT EXISTS wallet_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    did_id BIGINT NOT NULL REFERENCES dids(id) ON DELETE CASCADE,
    wallet_address VARCHAR(255) NOT NULL,
    
    -- Session security
    session_token_hash VARCHAR(255) NOT NULL,
    challenge_response VARCHAR(255) NOT NULL,
    signature_verification JSONB NOT NULL,
    
    -- Session lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Security tracking
    ip_address INET,
    user_agent TEXT,
    login_method VARCHAR(50) NOT NULL,
    
    INDEX idx_session_id (session_id),
    INDEX idx_session_did_id (did_id),
    INDEX idx_session_expires_at (expires_at),
    INDEX idx_session_is_active (is_active)
);

-- Verification Keys Table - ZK circuit verification keys
CREATE TABLE IF NOT EXISTS zk_verification_keys (
    id BIGSERIAL PRIMARY KEY,
    key_id VARCHAR(255) UNIQUE NOT NULL,
    circuit_name VARCHAR(100) NOT NULL,
    
    -- Key data
    verification_key JSONB NOT NULL,
    key_format VARCHAR(50) NOT NULL DEFAULT 'groth16',
    
    -- Key metadata
    created_by VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_vk_key_id (key_id),
    INDEX idx_vk_circuit_name (circuit_name),
    INDEX idx_vk_is_active (is_active)
);

-- Audit Log Table - Security and compliance tracking
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    
    -- Event details
    event_type VARCHAR(100) NOT NULL, -- did_created, vc_issued, zk_proof_generated, etc.
    entity_type VARCHAR(50) NOT NULL, -- did, vc, zkp, session
    entity_id VARCHAR(255) NOT NULL,
    
    -- Actor information
    actor_did VARCHAR(255),
    actor_wallet_address VARCHAR(255),
    actor_ip_address INET,
    
    -- Event data
    event_data JSONB DEFAULT '{}',
    result VARCHAR(50) NOT NULL, -- success, failure, error
    error_message TEXT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_event_type (event_type),
    INDEX idx_audit_entity_type (entity_type),
    INDEX idx_audit_entity_id (entity_id),
    INDEX idx_audit_actor_did (actor_did),
    INDEX idx_audit_created_at (created_at)
);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dids_updated_at 
    BEFORE UPDATE ON dids 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_verifiable_credentials_updated_at 
    BEFORE UPDATE ON verifiable_credentials 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dids_composite ON dids(wallet_address, is_active);
CREATE INDEX IF NOT EXISTS idx_vc_composite ON verifiable_credentials(did_id, status, type);
CREATE INDEX IF NOT EXISTS idx_zkp_composite ON zk_proofs(credential_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_session_composite ON wallet_sessions(wallet_address, is_active, expires_at);