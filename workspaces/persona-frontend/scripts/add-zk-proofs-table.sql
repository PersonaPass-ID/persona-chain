-- ZK Proofs Table Migration
-- Adds support for zero-knowledge proof storage and management

-- Create ZK Proofs table
CREATE TABLE IF NOT EXISTS zk_proofs (
    id TEXT PRIMARY KEY,
    credential_id TEXT NOT NULL REFERENCES verifiable_credentials(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    proof_type TEXT NOT NULL,
    public_inputs JSONB NOT NULL DEFAULT '{}',
    proof_data TEXT NOT NULL,
    verification_key TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    purpose TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_zk_proofs_credential_id ON zk_proofs(credential_id);
CREATE INDEX IF NOT EXISTS idx_zk_proofs_wallet_address ON zk_proofs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_zk_proofs_proof_type ON zk_proofs(proof_type);
CREATE INDEX IF NOT EXISTS idx_zk_proofs_status ON zk_proofs(status);
CREATE INDEX IF NOT EXISTS idx_zk_proofs_created_at ON zk_proofs(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_zk_proofs_updated_at BEFORE UPDATE ON zk_proofs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for active proofs with credential information
CREATE OR REPLACE VIEW active_zk_proofs AS
SELECT 
    zp.id,
    zp.credential_id,
    zp.wallet_address,
    zp.proof_type,
    zp.public_inputs,
    zp.metadata,
    zp.purpose,
    zp.usage_count,
    zp.created_at,
    zp.expires_at,
    vc.credential_type,
    vc.did,
    CASE 
        WHEN zp.expires_at IS NULL THEN 'active'
        WHEN zp.expires_at > NOW() THEN 'active'
        ELSE 'expired'
    END as computed_status
FROM zk_proofs zp
LEFT JOIN verifiable_credentials vc ON zp.credential_id = vc.id
WHERE zp.status = 'active';

-- Add RLS (Row Level Security) policies
ALTER TABLE zk_proofs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own proofs
CREATE POLICY zk_proofs_user_access ON zk_proofs
    FOR ALL USING (wallet_address = current_setting('app.current_wallet_address', true));

-- Policy: Service role can access all proofs
CREATE POLICY zk_proofs_service_access ON zk_proofs
    FOR ALL TO service_role USING (true);

-- Grant necessary permissions
GRANT ALL ON zk_proofs TO authenticated;
GRANT ALL ON zk_proofs TO service_role;
GRANT SELECT ON active_zk_proofs TO authenticated;
GRANT SELECT ON active_zk_proofs TO service_role;

-- Add comments for documentation
COMMENT ON TABLE zk_proofs IS 'Stores zero-knowledge proofs generated from verifiable credentials';
COMMENT ON COLUMN zk_proofs.id IS 'Unique identifier for the ZK proof';
COMMENT ON COLUMN zk_proofs.credential_id IS 'Reference to the source verifiable credential';
COMMENT ON COLUMN zk_proofs.proof_type IS 'Type of proof (age-verification, jurisdiction-proof, etc.)';
COMMENT ON COLUMN zk_proofs.public_inputs IS 'Public inputs for proof verification';
COMMENT ON COLUMN zk_proofs.proof_data IS 'The actual zero-knowledge proof data';
COMMENT ON COLUMN zk_proofs.verification_key IS 'Verification key for the proof';
COMMENT ON COLUMN zk_proofs.metadata IS 'Additional metadata about the proof';
COMMENT ON COLUMN zk_proofs.purpose IS 'Intended use case for the proof';
COMMENT ON COLUMN zk_proofs.usage_count IS 'Number of times this proof has been used';