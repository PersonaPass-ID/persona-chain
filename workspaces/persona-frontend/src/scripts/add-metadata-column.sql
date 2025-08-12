-- Add missing metadata column to verifiable_credentials table
-- Run this in Supabase SQL Editor to fix the schema

DO $$ 
BEGIN
    -- Check if metadata column doesn't exist and add it
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'verifiable_credentials' 
                  AND column_name = 'metadata') THEN
        ALTER TABLE verifiable_credentials 
        ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}';
        
        RAISE NOTICE 'Added metadata column to verifiable_credentials table';
    ELSE
        RAISE NOTICE 'Metadata column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'verifiable_credentials'
AND column_name = 'metadata';