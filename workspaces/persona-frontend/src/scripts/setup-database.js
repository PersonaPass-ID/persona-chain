// Database Setup Script for REAL PersonaPass Web3 Identity Storage
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Core table creation - identity_records first
const CORE_TABLE = `
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
`

async function setupCoreTable() {
  console.log('🚀 Setting up PersonaPass Web3 Identity Core Table...')
  console.log(`📍 Target: ${supabaseUrl}`)
  
  try {
    // Test connection first
    console.log('🔌 Testing database connection...')
    
    // Try a simple query to test connection
    const { data: testData, error: testError } = await supabase
      .rpc('version') // Get PostgreSQL version
    
    if (testError) {
      console.log('⚠️ RPC test failed, trying alternative connection test...')
      
      // Alternative connection test - this might work better
      const { data: altTest, error: altError } = await supabase
        .from('pg_stat_user_tables')  
        .select('schemaname')
        .limit(1)
        
      if (altError) {
        console.log('ℹ️ Standard connection tests failed - this is normal for anon key')
        console.log('✅ Proceeding with table creation (anon key has limited permissions)')
      } else {
        console.log('✅ Database connection successful via alternative method')
      }
    } else {
      console.log('✅ Database connection successful')
      console.log('📊 PostgreSQL version:', testData)
    }
    
    console.log('\n🏗️ Note: With anon key, tables must be created manually in Supabase SQL Editor')
    console.log('📋 Here are the SQL commands to run:')
    console.log('\n' + '='.repeat(80))
    console.log(CORE_TABLE)
    console.log('='.repeat(80))
    
    console.log('\n📝 MANUAL SETUP INSTRUCTIONS:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Copy the SQL above and paste it')
    console.log('3. Click "RUN" to create the tables')
    console.log('4. Test with: curl -X POST http://localhost:3000/api/test/real-identity-flow')
    
    // Try to verify if tables already exist
    console.log('\n🔍 Checking if identity_records table already exists...')
    
    const { data: existingData, error: existingError } = await supabase
      .from('identity_records')
      .select('count')
      .limit(1)
    
    if (!existingError) {
      console.log('✅ identity_records table already exists!')
      console.log('🧪 You can now test with: curl -X POST http://localhost:3000/api/test/real-identity-flow')
      return true
    } else {
      console.log('📋 identity_records table needs to be created manually')
      return false
    }
    
  } catch (error) {
    console.error('❌ Setup process failed:', error.message)
    return false
  }
}

if (require.main === module) {
  setupCoreTable().then(success => {
    if (success) {
      console.log('\n🎉 Database verification completed!')
      process.exit(0)
    } else {
      console.log('\n⚠️ Manual setup required')
      process.exit(0) // Not an error - just needs manual setup
    }
  }).catch(error => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
}

module.exports = setupCoreTable