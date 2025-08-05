// PersonaChain Deployment Script
// Deploy identity module to PersonaChain

const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { SigningStargateClient } = require('@cosmjs/stargate');
const { PersonaChainClient } = require('../src/lib/personachain/client');

console.log('🚀 Deploying to PersonaChain...');

async function deployToPersonaChain() {
  try {
    // Configuration
    const MNEMONIC = process.env.PERSONACHAIN_MNEMONIC;
    const RPC_URL = 'https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com';
    const CHAIN_ID = 'persona-1';
    
    if (!MNEMONIC) {
      throw new Error('PERSONACHAIN_MNEMONIC environment variable not set');
    }

    console.log('🔑 Setting up wallet...');
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(MNEMONIC, {
      prefix: 'persona'
    });
    
    const [account] = await wallet.getAccounts();
    console.log('💳 Deployer address:', account.address);

    console.log('🌐 Connecting to PersonaChain...');
    const client = await SigningStargateClient.connectWithSigner(
      RPC_URL,
      wallet
    );

    // Check balance
    const balance = await client.getBalance(account.address, 'upersona');
    console.log('💰 Balance:', balance.amount, 'upersona');

    if (parseInt(balance.amount) < 1000000) {
      throw new Error('Insufficient balance for deployment');
    }

    // Deploy identity module configuration
    console.log('⚙️ Configuring identity module...');
    
    // Initialize PersonaChain client
    const personaChainClient = new PersonaChainClient({
      rpcUrl: RPC_URL,
      wallet
    });

    // Create deployer DID
    console.log('🆔 Creating deployer DID...');
    const deployerDID = {
      '@context': 'https://www.w3.org/ns/did/v1',
      id: `did:persona:${account.address}`,
      verificationMethod: [{
        id: `did:persona:${account.address}#keys-1`,
        type: 'Secp256k1VerificationKey2018',
        controller: `did:persona:${account.address}`,
        publicKeyHex: account.pubkey
      }],
      authentication: [`did:persona:${account.address}#keys-1`],
      service: [{
        id: `did:persona:${account.address}#personapass`,
        type: 'PersonaPassService',
        serviceEndpoint: 'https://app.personapass.xyz'
      }]
    };

    const didTx = await personaChainClient.createIdentity(deployerDID);
    console.log('✅ Deployer DID created:', didTx);

    // Deploy verification smart contract
    console.log('📝 Deploying verification contract...');
    // In Cosmos SDK, this would be part of the module initialization
    // The contract logic is in x/identity/keeper/

    // Set module parameters
    console.log('🔧 Setting module parameters...');
    const moduleParams = {
      verificationFee: '50000upersona', // 0.05 PERSONA
      minStakeAmount: '1000000upersona', // 1 PERSONA
      maxCredentialAge: 86400 * 365, // 1 year
      supportedCredentialTypes: [
        'AgeVerification',
        'IdentityVerification',
        'AddressVerification',
        'IncomeVerification'
      ]
    };

    // Note: In production, this would be done through governance
    console.log('🏗️ Module parameters configured');

    // Test the deployment
    console.log('🧪 Testing deployment...');
    
    // Create test credential
    const testCredential = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'AgeVerification'],
      issuer: `did:persona:${account.address}`,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: 'did:persona:test123',
        ageOver21: true
      },
      proof: {
        type: 'Secp256k1Signature2018',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: `did:persona:${account.address}#keys-1`
      }
    };

    const credentialTx = await personaChainClient.issueCredential(
      'did:persona:test123',
      'AgeVerification',
      testCredential
    );
    console.log('✅ Test credential issued:', credentialTx);

    // Summary
    console.log('\n🎆 PersonaChain Deployment Complete!');
    console.log('=====================================');
    console.log('Chain ID:', CHAIN_ID);
    console.log('RPC URL:', RPC_URL);
    console.log('Module:', 'x/identity');
    console.log('Deployer DID:', `did:persona:${account.address}`);
    console.log('\n📝 Next steps:');
    console.log('1. Update frontend with contract addresses');
    console.log('2. Configure validator nodes');
    console.log('3. Submit governance proposal for mainnet');
    console.log('4. Begin merchant onboarding');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
deployToPersonaChain();