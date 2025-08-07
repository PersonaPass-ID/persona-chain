-- Fix database schema mismatches for PersonaPass Web3 Identity
-- Run this in Supabase SQL Editor to update the schema

-- Step 1: Check if the table exists with old schema
DO $$ 
BEGIN
    -- Check if verifiable_credentials table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verifiable_credentials') THEN
        -- Rename columns to match our code expectations
        
        -- Check and rename holder_did to did if needed
        IF EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'verifiable_credentials' 
                   AND column_name = 'holder_did') 
           AND NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_name = 'verifiable_credentials' 
                          AND column_name = 'did') THEN
            ALTER TABLE verifiable_credentials RENAME COLUMN holder_did TO did;
        END IF;
        
        -- Add subject_did column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'verifiable_credentials' 
                      AND column_name = 'subject_did') THEN
            ALTER TABLE verifiable_credentials ADD COLUMN subject_did TEXT;
            -- Set subject_did to same as did initially
            UPDATE verifiable_credentials SET subject_did = did WHERE subject_did IS NULL;
            -- Make it NOT NULL after setting values
            ALTER TABLE verifiable_credentials ALTER COLUMN subject_did SET NOT NULL;
        END IF;
        
        -- Check and rename encrypted_content to encrypted_credential if needed
        IF EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'verifiable_credentials' 
                   AND column_name = 'encrypted_content') 
           AND NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_name = 'verifiable_credentials' 
                          AND column_name = 'encrypted_credential') THEN
            ALTER TABLE verifiable_credentials RENAME COLUMN encrypted_content TO encrypted_credential;
        END IF;
        
        -- Check and rename issued_at to issuance_date if needed
        IF EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'verifiable_credentials' 
                   AND column_name = 'issued_at') 
           AND NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_name = 'verifiable_credentials' 
                          AND column_name = 'issuance_date') THEN
            ALTER TABLE verifiable_credentials RENAME COLUMN issued_at TO issuance_date;
        END IF;
        
        -- Check and rename expires_at to expiration_date if needed
        IF EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'verifiable_credentials' 
                   AND column_name = 'expires_at') 
           AND NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_name = 'verifiable_credentials' 
                          AND column_name = 'expiration_date') THEN
            ALTER TABLE verifiable_credentials RENAME COLUMN expires_at TO expiration_date;
        END IF;
        
        -- Update status values if needed (active -> valid)
        UPDATE verifiable_credentials 
        SET status = 'valid' 
        WHERE status = 'active';
        
        -- Update the check constraint for status
        ALTER TABLE verifiable_credentials 
        DROP CONSTRAINT IF EXISTS verifiable_credentials_status_check;
        
        ALTER TABLE verifiable_credentials 
        ADD CONSTRAINT verifiable_credentials_status_check 
        CHECK (status IN ('valid', 'revoked', 'suspended'));
        
        RAISE NOTICE 'Schema migration completed successfully!';
    ELSE
        -- Create the table with the correct schema
        CREATE TABLE verifiable_credentials (
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
          metadata JSONB NOT NULL DEFAULT '{}',
          blockchain_tx_hash TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          
          FOREIGN KEY (did) REFERENCES identity_records(did) ON DELETE CASCADE
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_vc_credential_id ON verifiable_credentials(credential_id);
        CREATE INDEX IF NOT EXISTS idx_vc_did ON verifiable_credentials(did);
        CREATE INDEX IF NOT EXISTS idx_vc_content_hash ON verifiable_credentials(content_hash);
        CREATE INDEX IF NOT EXISTS idx_vc_type ON verifiable_credentials(credential_type);
        CREATE INDEX IF NOT EXISTS idx_vc_status ON verifiable_credentials(status);
        CREATE INDEX IF NOT EXISTS idx_vc_issuer ON verifiable_credentials(issuer_did);
        CREATE INDEX IF NOT EXISTS idx_vc_subject ON verifiable_credentials(subject_did);
        
        -- Enable RLS
        ALTER TABLE verifiable_credentials ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policy
        CREATE POLICY "Users can access credentials for their DIDs" ON verifiable_credentials
          FOR ALL USING (true);
        
        RAISE NOTICE 'Table created with correct schema!';
    END IF;
END $$;

-- Step 2: Verify the final schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'verifiable_credentials'
ORDER BY ordinal_position;