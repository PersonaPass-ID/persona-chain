/**
 * PersonaPass SDK Basic Usage Examples
 * 
 * This file demonstrates the most common SDK usage patterns.
 */

import { PersonaPassSDK } from '@personapass/sdk';

// Initialize SDK
const personaPass = new PersonaPassSDK({
  apiKey: 'your-api-key-here',
  network: 'testnet', // Use 'mainnet' for production
  debug: true
});

// Example wallet address (replace with actual user's wallet)
const userWallet = '0x742d35Cc6634C0532925a3b8D2C7C51b45e89C9f';

/**
 * Example 1: Age Verification
 * Prove user is over 18 without revealing exact age
 */
async function exampleAgeVerification() {
  console.log('🎂 Age Verification Example');
  
  try {
    // Check if user has verified credentials
    const status = await personaPass.getCredentialStatus(userWallet);
    console.log('Credential status:', status);
    
    if (!status.hasCredentials) {
      // Start verification process
      const verificationUrl = await personaPass.startVerification(userWallet);
      console.log('Please complete verification at:', verificationUrl);
      return;
    }
    
    // Generate age proof
    const ageProof = await personaPass.generateProof({
      type: 'age-verification',
      walletAddress: userWallet,
      purpose: 'Access 18+ DeFi trading platform',
      constraints: {
        minAge: 18
      }
    });
    
    console.log('✅ Age proof generated:', {
      proofId: ageProof.proofId,
      downloadUrl: ageProof.downloadUrl,
      verificationUrl: ageProof.verificationUrl
    });
    
    // Verify the proof
    const verification = await personaPass.verifyProof(ageProof.proofId);
    console.log('🔍 Proof verification result:', verification.valid);
    
  } catch (error) {
    console.error('❌ Age verification failed:', error);
  }
}

/**
 * Example 2: Jurisdiction Proof
 * Prove user is located in allowed regions without revealing exact location
 */
async function exampleJurisdictionProof() {
  console.log('🌍 Jurisdiction Proof Example');
  
  try {
    const jurisdictionProof = await personaPass.generateProof({
      type: 'jurisdiction-proof',
      walletAddress: userWallet,
      purpose: 'Comply with regional NFT marketplace restrictions',
      constraints: {
        allowedRegions: ['US', 'EU', 'UK', 'CA']
      }
    });
    
    console.log('✅ Jurisdiction proof generated:', jurisdictionProof.proofId);
    
    // Verify immediately
    const isValid = await personaPass.verifyProof(jurisdictionProof.proofId);
    console.log('🔍 Jurisdiction proof valid:', isValid.valid);
    
  } catch (error) {
    console.error('❌ Jurisdiction proof failed:', error);
  }
}

/**
 * Example 3: Accredited Investor Verification
 * Prove investment eligibility without revealing net worth
 */
async function exampleAccreditedInvestor() {
  console.log('💼 Accredited Investor Example');
  
  try {
    const investorProof = await personaPass.generateProof({
      type: 'accredited-investor',
      walletAddress: userWallet,
      purpose: 'Participate in private token sale',
      constraints: {
        minNetWorth: 1000000, // $1M minimum
        accreditationLevel: 'individual'
      }
    });
    
    console.log('✅ Accredited investor proof generated:', investorProof.proofId);
    
  } catch (error) {
    console.error('❌ Accredited investor verification failed:', error);
  }
}

/**
 * Example 4: Anti-Sybil Protection
 * Prove unique personhood for DAO voting or airdrops
 */
async function exampleAntiSybil() {
  console.log('👤 Anti-Sybil Protection Example');
  
  try {
    const sybilProof = await personaPass.generateProof({
      type: 'anti-sybil',
      walletAddress: userWallet,
      purpose: 'DAO governance voting - prevent multiple accounts',
      constraints: {
        uniquenessSet: 'dao-governance-2024',
        confidenceThreshold: 85
      }
    });
    
    console.log('✅ Anti-Sybil proof generated:', sybilProof.proofId);
    
    // This proof can be used to prevent the same person from voting multiple times
    // even if they have multiple wallet addresses
    
  } catch (error) {
    console.error('❌ Anti-Sybil protection failed:', error);
  }
}

/**
 * Example 5: Event Handling
 * Listen to SDK events for real-time updates
 */
function exampleEventHandling() {
  console.log('📡 Event Handling Example');
  
  // Listen for proof generation events
  personaPass.on('proof_generated', (event) => {
    console.log('🔮 Proof generated event:', {
      proofType: event.data.proof.proof.type,
      proofId: event.data.proof.proofId,
      timestamp: event.timestamp
    });
  });
  
  // Listen for verification events
  personaPass.on('proof_verified', (event) => {
    console.log('🔍 Proof verified event:', {
      valid: event.data.result.valid,
      proofType: event.data.result.proofType,
      timestamp: event.timestamp
    });
  });
  
  // Listen for errors
  personaPass.on('error', (event) => {
    console.error('❌ SDK error event:', {
      code: event.data.error.code,
      message: event.data.error.message,
      timestamp: event.timestamp
    });
  });
  
  console.log('✅ Event listeners attached');
}

/**
 * Example 6: Batch Proof Generation
 * Generate multiple proofs efficiently
 */
async function exampleBatchProofGeneration() {
  console.log('📦 Batch Proof Generation Example');
  
  try {
    // Generate multiple proofs in parallel
    const proofPromises = [
      personaPass.generateProof({
        type: 'age-verification',
        walletAddress: userWallet,
        purpose: 'Age verification for DeFi',
        constraints: { minAge: 18 }
      }),
      personaPass.generateProof({
        type: 'jurisdiction-proof',
        walletAddress: userWallet,
        purpose: 'Location verification for NFT marketplace',
        constraints: { allowedRegions: ['US', 'EU'] }
      }),
      personaPass.generateProof({
        type: 'anti-sybil',
        walletAddress: userWallet,
        purpose: 'Unique person verification for airdrop',
        constraints: { uniquenessSet: 'airdrop-2024' }
      })
    ];
    
    const proofs = await Promise.allSettled(proofPromises);
    
    proofs.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ Proof ${index + 1} generated:`, result.value.proofId);
      } else {
        console.error(`❌ Proof ${index + 1} failed:`, result.reason);
      }
    });
    
  } catch (error) {
    console.error('❌ Batch proof generation failed:', error);
  }
}

/**
 * Example 7: Proof Caching
 * Use cached proofs to improve performance
 */
async function exampleProofCaching() {
  console.log('💾 Proof Caching Example');
  
  try {
    // Generate proof with caching enabled
    const cachedProof = await personaPass.generateProof(
      {
        type: 'age-verification',
        walletAddress: userWallet,
        purpose: 'Age verification with caching',
        constraints: { minAge: 21 }
      },
      {
        useCache: true,
        persistProof: true,
        timeout: 60000 // 1 minute timeout
      }
    );
    
    console.log('✅ Cached proof generated:', cachedProof.proofId);
    
    // Second call will use cached proof if constraints match
    const cachedProof2 = await personaPass.generateProof(
      {
        type: 'age-verification',
        walletAddress: userWallet,
        purpose: 'Age verification with caching',
        constraints: { minAge: 21 }
      },
      {
        useCache: true
      }
    );
    
    console.log('✅ Second proof (from cache):', cachedProof2.proofId);
    
  } catch (error) {
    console.error('❌ Proof caching failed:', error);
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('🚀 Starting PersonaPass SDK Examples\n');
  
  // Setup event handling first
  exampleEventHandling();
  
  // Wait a bit for initialization
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Run examples sequentially
  await exampleAgeVerification();
  console.log('');
  
  await exampleJurisdictionProof();
  console.log('');
  
  await exampleAccreditedInvestor();
  console.log('');
  
  await exampleAntiSybil();
  console.log('');
  
  await exampleBatchProofGeneration();
  console.log('');
  
  await exampleProofCaching();
  console.log('');
  
  console.log('✅ All examples completed!');
}

// Export examples for use in other files
export {
  exampleAgeVerification,
  exampleJurisdictionProof,
  exampleAccreditedInvestor,
  exampleAntiSybil,
  exampleEventHandling,
  exampleBatchProofGeneration,
  exampleProofCaching,
  runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}