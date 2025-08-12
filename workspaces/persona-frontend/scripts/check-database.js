#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkDatabase() {
  console.log('🔍 SUPABASE DATABASE CHECK\n');
  console.log('========================\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Test 1: Check if table exists and get sample structure
    console.log('📊 Testing table access...');
    const { data, error } = await supabase
      .from('verifiable_credentials')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing table:', error.message);
      
      if (error.message.includes('metadata')) {
        console.log('💡 The metadata column is still missing!');
        console.log('🔧 Need to run: ALTER TABLE verifiable_credentials ADD COLUMN metadata JSONB DEFAULT \'{}\';');
        return false;
      }
    } else {
      console.log('✅ Table is accessible');
      
      if (data && data.length > 0) {
        console.log('📋 Sample record columns:', Object.keys(data[0]));
        
        // Check for required columns
        const requiredColumns = ['did', 'credential_id', 'encrypted_credential', 'metadata'];
        const existingColumns = Object.keys(data[0]);
        
        console.log('\n📋 Required columns check:');
        requiredColumns.forEach(col => {
          if (existingColumns.includes(col)) {
            console.log(`   ✅ ${col}`);
          } else {
            console.log(`   ❌ ${col} - MISSING!`);
          }
        });
        
      } else {
        console.log('📋 Table is empty, testing insert capability...');
        
        // Try to insert a test record to see what columns are expected
        const testData = {
          did: 'did:test:schema_check',
          credential_id: 'test_schema_check',
          encrypted_credential: 'test_data',
          wallet_address: 'cosmos1test',
          wallet_type: 'test',
          issuance_date: new Date().toISOString(),
          metadata: { test: true }
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('verifiable_credentials')
          .insert(testData)
          .select()
          .single();
          
        if (insertError) {
          console.log('❌ Insert test failed:', insertError.message);
          
          if (insertError.message.includes('metadata')) {
            console.log('💡 CONFIRMED: metadata column is missing!');
            return false;
          }
        } else {
          console.log('✅ Test insert successful - all required columns exist!');
          console.log('📋 Inserted record columns:', Object.keys(insertData));
          
          // Clean up test record
          await supabase
            .from('verifiable_credentials')
            .delete()
            .eq('credential_id', 'test_schema_check');
            
          console.log('🧹 Test record cleaned up');
        }
      }
    }
    
    // Test 2: Check record count
    console.log('\n📊 Checking record count...');
    const { count, error: countError } = await supabase
      .from('verifiable_credentials')
      .select('*', { count: 'exact', head: true });
      
    if (!countError) {
      console.log(`📊 Total records: ${count}`);
    } else {
      console.log('❌ Count error:', countError.message);
    }
    
    return true;
    
  } catch (err) {
    console.error('💥 Database test failed:', err.message);
    return false;
  }
}

// Also check Didit configuration
async function checkDidit() {
  console.log('\n🆔 DIDIT API CHECK\n');
  console.log('==================\n');
  
  const apiKey = process.env.DIDIT_API_KEY;
  const workflowId = process.env.DIDIT_WORKFLOW_ID;
  
  if (!apiKey || !workflowId) {
    console.log('❌ Missing Didit credentials');
    return false;
  }
  
  console.log(`API Key: ${apiKey.substring(0, 15)}...`);
  console.log(`Workflow ID: ${workflowId}`);
  
  try {
    console.log('\n🧪 Testing session creation...');
    
    const response = await fetch('https://verification.didit.me/v2/session/', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        vendor_data: 'test_' + Date.now()
      })
    });
    
    const responseText = await response.text();
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Didit API working!');
      try {
        const data = JSON.parse(responseText);
        console.log(`   Session URL: ${data.url}`);
      } catch (e) {
        console.log('   Session created successfully');
      }
      return true;
    } else {
      console.log(`❌ API failed: ${response.status}`);
      console.log(`Response: ${responseText.substring(0, 200)}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Didit test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 PERSONAPASS SYSTEM CHECK');
  console.log('===========================\n');
  
  const dbOk = await checkDatabase();
  const diditOk = await checkDidit();
  
  console.log('\n📊 FINAL RESULTS:');
  console.log('=================');
  console.log(`🗄️  Database: ${dbOk ? '✅ WORKING' : '❌ NEEDS FIXING'}`);
  console.log(`🆔 Didit API: ${diditOk ? '✅ WORKING' : '❌ NEEDS FIXING'}`);
  
  if (dbOk && diditOk) {
    console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
    console.log('Ready to implement the enhanced Web3-native KYC architecture!');
  } else {
    console.log('\n⚠️  Issues detected - need to fix before proceeding');
  }
}

main().catch(console.error);