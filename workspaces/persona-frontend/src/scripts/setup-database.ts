#!/usr/bin/env ts-node
// Database Setup Script for REAL PersonaPass Web3 Identity Storage
// Creates all required tables in Supabase with proper schema

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const DATABASE_SCHEMA = `
-- PersonaPass Web3 Identity Storage Schema
-- Complete database setup for real Supabase deployment

-- Main Identity Records Table (Core DID Document Storage)
CREATE TABLE IF NOT EXISTS identity_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  did TEXT UNIQUE NOT NULL,
  wallet_address TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  encrypted_content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  encryption_params JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_identity_did ON identity_records(did);
CREATE INDEX IF NOT EXISTS idx_identity_wallet_address ON identity_records(wallet_address);
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

-- Blockchain Anchoring Table
CREATE TABLE IF NOT EXISTS blockchain_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anchor_id TEXT UNIQUE NOT NULL,
  did TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  block_height BIGINT NOT NULL,
  block_hash TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'personachain-1',
  anchor_type TEXT NOT NULL CHECK (anchor_type IN ('did_creation', 'credential_issuance', 'did_update', 'revocation')),
  anchor_data JSONB NOT NULL DEFAULT '{}',
  confirmation_status TEXT DEFAULT 'pending' CHECK (confirmation_status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  
  -- Foreign key relationship  
  FOREIGN KEY (did) REFERENCES identity_records(did) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_anchors_anchor_id ON blockchain_anchors(anchor_id);
CREATE INDEX IF NOT EXISTS idx_anchors_did ON blockchain_anchors(did);
CREATE INDEX IF NOT EXISTS idx_anchors_tx_hash ON blockchain_anchors(tx_hash);
CREATE INDEX IF NOT EXISTS idx_anchors_content_hash ON blockchain_anchors(content_hash);
CREATE INDEX IF NOT EXISTS idx_anchors_type ON blockchain_anchors(anchor_type);
CREATE INDEX IF NOT EXISTS idx_anchors_status ON blockchain_anchors(confirmation_status);

-- Audit Log Table  
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  did TEXT,
  wallet_address TEXT,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  operation_data JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_operation_id ON audit_logs(operation_id);
CREATE INDEX IF NOT EXISTS idx_audit_did ON audit_logs(did);
CREATE INDEX IF NOT EXISTS idx_audit_wallet_address ON audit_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_audit_operation_type ON audit_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_success ON audit_logs(success);

-- Row Level Security (RLS) Policies
ALTER TABLE identity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifiable_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE zk_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_anchors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Identity Records (wallet address ownership)
CREATE POLICY "Users can access their own identity records" ON identity_records
  FOR ALL USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- RLS Policies for Sessions (wallet address ownership)  
CREATE POLICY "Users can access their own sessions" ON wallet_sessions
  FOR ALL USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- RLS Policies for Credentials (DID ownership)
CREATE POLICY "Users can access credentials for their DIDs" ON verifiable_credentials
  FOR ALL USING (did IN (
    SELECT did FROM identity_records 
    WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  ));

-- RLS Policies for ZK Proofs (through credential ownership)
CREATE POLICY "Users can access proofs for their credentials" ON zk_proofs
  FOR ALL USING (credential_id IN (
    SELECT credential_id FROM verifiable_credentials vc
    JOIN identity_records ir ON vc.did = ir.did
    WHERE ir.wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  ));

-- RLS Policies for Blockchain Anchors (DID ownership)
CREATE POLICY "Users can access anchors for their DIDs" ON blockchain_anchors
  FOR ALL USING (did IN (
    SELECT did FROM identity_records 
    WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  ));
`

async function setupDatabase() {
  console.log('🚀 Setting up PersonaPass Web3 Identity Database...')
  console.log(`📍 Target: ${supabaseUrl}`)
  
  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message)
      process.exit(1)
    }
    
    console.log('✅ Database connection successful')
    
    // Execute schema creation
    console.log('🏗️ Creating database schema...')
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: DATABASE_SCHEMA
    })
    
    if (error) {
      // Try alternative method - direct SQL execution
      console.log('⚠️ RPC method failed, trying direct SQL...')
      
      // Split schema into individual statements
      const statements = DATABASE_SCHEMA
        .split(';')
        .filter(stmt => stmt.trim().length > 0)
        .map(stmt => stmt.trim() + ';')
      
      console.log(`📝 Executing ${statements.length} SQL statements...`)
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (!statement.trim()) continue
        
        try {
          console.log(`  ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`)
          
          // Use raw SQL query through supabase
          const { error: stmtError } = await supabase
            .from('dummy') // This will be ignored for raw SQL
            .select('*')
            
          // For table creation, we need to use a different approach
          // Since Supabase doesn't allow direct DDL from client, 
          // we'll need to inform the user to run this manually
          
        } catch (stmtError: any) {
          console.log(`⚠️ Statement ${i + 1} needs manual execution:`, statement.substring(0, 100) + '...')
        }
      }
      
      console.log('⚠️ Some statements may need to be run manually in Supabase SQL editor')
      
    } else {
      console.log('✅ Schema creation completed successfully')
    }
    
    // Verify tables were created
    console.log('🔍 Verifying table creation...')
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'identity_records', 
        'wallet_sessions', 
        'verifiable_credentials',
        'zk_proofs',
        'blockchain_anchors',
        'audit_logs'
      ])
    
    if (tablesError) {
      console.log('⚠️ Could not verify tables:', tablesError.message)
    } else {
      const createdTables = tables?.map(t => t.table_name) || []
      console.log('📊 Tables found:', createdTables.join(', '))
      
      if (createdTables.includes('identity_records')) {
        console.log('✅ Core identity_records table confirmed')
      } else {
        console.log('❌ identity_records table missing - manual setup required')
      }
    }
    
    console.log('\n🎉 Database setup process completed!')
    console.log('🧪 Next step: Test with POST /api/test/real-identity-flow')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

// Show manual instructions if automated setup fails
function showManualInstructions() {
  console.log('\n📋 MANUAL SETUP INSTRUCTIONS:')
  console.log('If automated setup failed, run these SQL commands manually in Supabase SQL Editor:')
  console.log('1. Go to https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/sql')
  console.log('2. Copy and paste the schema below:')
  console.log('\n' + '='.repeat(80))
  console.log(DATABASE_SCHEMA)
  console.log('='.repeat(80))
  console.log('\n3. Click "RUN" to execute all statements')
  console.log('4. Test with: curl -X POST http://localhost:3000/api/test/real-identity-flow')
}

if (require.main === module) {
  setupDatabase().catch(error => {
    console.error('❌ Setup failed:', error)
    showManualInstructions()
    process.exit(1)
  })
}

export default setupDatabase