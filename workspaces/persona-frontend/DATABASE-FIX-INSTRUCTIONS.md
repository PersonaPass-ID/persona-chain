# Database Schema Fix Instructions

## Problem
The database schema in Supabase has mismatched column names that are causing credential storage to fail.

## Solution
Run the migration script to fix the column names.

## Steps to Fix

1. **Go to Supabase SQL Editor**
   - Open your Supabase dashboard
   - Navigate to SQL Editor
   - Click "New Query"

2. **Run the Migration Script**
   - Copy the entire contents of `src/scripts/fix-database-schema.sql`
   - Paste it into the SQL Editor
   - Click "RUN" button

3. **Verify the Fix**
   The script will:
   - Rename `holder_did` → `did`
   - Add `subject_did` column if missing
   - Rename `encrypted_content` → `encrypted_credential`
   - Rename `issued_at` → `issuance_date`
   - Rename `expires_at` → `expiration_date`
   - Update status values from 'active' to 'valid'
   - Update check constraints

4. **Test the Fix**
   - Try creating a basic identity again
   - The credential should now store successfully

## Column Mappings

| Old Column Name | New Column Name |
|-----------------|-----------------|
| holder_did | did |
| encrypted_content | encrypted_credential |
| issued_at | issuance_date |
| expires_at | expiration_date |
| status: 'active' | status: 'valid' |

## Important Notes
- The script is safe to run multiple times - it checks for existing columns before renaming
- If the table doesn't exist, it will create it with the correct schema
- After running, your credentials should store successfully