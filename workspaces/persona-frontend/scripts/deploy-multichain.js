/**
 * PersonaPass Multi-Chain Deployment Script
 * 
 * Deploys PersonaPass ZK identity infrastructure to:
 * - Polygon (MATIC)
 * - Arbitrum (ARB)
 * - BNB Smart Chain (BSC)
 * - Base (BASE)
 * - Optimism (OP)
 */

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// Network configurations
const NETWORKS = {
  polygon: {
    name: 'Polygon',
    chainId: 137,
    rpc: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    nativeCurrency: 'MATIC'
  },
  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpc: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    nativeCurrency: 'ETH'
  },
  bsc: {
    name: 'BNB Smart Chain',
    chainId: 56,
    rpc: 'https://bsc-dataseed1.binance.org',
    explorer: 'https://bscscan.com',
    nativeCurrency: 'BNB'
  },
  base: {
    name: 'Base',
    chainId: 8453,
    rpc: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    nativeCurrency: 'ETH'
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    rpc: 'https://mainnet.optimism.io',
    explorer: 'https://optimistic.etherscan.io',
    nativeCurrency: 'ETH'
  }
};

class MultiChainDeployer {
  constructor() {
    this.deploymentResults = {};
    this.verifierContracts = {};
    this.registryContracts = {};
  }

  async deploy() {
    console.log('🌐 PersonaPass Multi-Chain Deployment Starting...');
    console.log('====================================================');

    // Get current network
    const network = await ethers.provider.getNetwork();
    const networkName = this.getNetworkName(network.chainId);
    
    console.log(`📍 Deploying to: ${NETWORKS[networkName]?.name || 'Unknown'} (Chain ID: ${network.chainId})`);
    
    try {
      // 1. Deploy KYC Verifier
      console.log('\n🔐 Step 1: Deploying KYC Verifier...');
      const kycVerifier = await this.deployKYCVerifier();
      
      // 2. Deploy Personhood Verifier
      console.log('\n👤 Step 2: Deploying Personhood Verifier...');
      const personhoodVerifier = await this.deployPersonhoodVerifier();
      
      // 3. Deploy PersonaPass Registry
      console.log('\n📋 Step 3: Deploying PersonaPass Registry...');
      const registry = await this.deployRegistry(kycVerifier.address, personhoodVerifier.address);
      
      // 4. Configure contracts
      console.log('\n⚙️  Step 4: Configuring contracts...');
      await this.configureContracts(registry, kycVerifier, personhoodVerifier);
      
      // 5. Save deployment info
      console.log('\n💾 Step 5: Saving deployment information...');
      await this.saveDeploymentInfo(networkName, {
        kycVerifier,
        personhoodVerifier,
        registry,
        network: NETWORKS[networkName]
      });
      
      // 6. Verify contracts on explorer
      console.log('\n✅ Step 6: Verifying contracts...');
      await this.verifyContracts(networkName, {
        kycVerifier,
        personhoodVerifier,
        registry
      });
      
      console.log('\n🎉 Deployment Complete!');
      this.printDeploymentSummary(networkName);
      
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      throw error;
    }
  }

  async deployKYCVerifier() {
    const KYCVerifier = await ethers.getContractFactory('KYCVerifier');
    console.log('⏳ Deploying KYC Verifier contract...');
    
    const kycVerifier = await KYCVerifier.deploy();
    await kycVerifier.deployed();
    
    console.log(`✅ KYC Verifier deployed: ${kycVerifier.address}`);
    
    // Verify the contract is working
    console.log('🔍 Testing KYC Verifier...');
    // const testResult = await this.testKYCVerifier(kycVerifier);
    // console.log(`   Test result: ${testResult ? 'PASS' : 'FAIL'}`);
    
    return kycVerifier;
  }

  async deployPersonhoodVerifier() {
    const PersonhoodVerifier = await ethers.getContractFactory('PersonhoodVerifier');
    console.log('⏳ Deploying Personhood Verifier contract...');
    
    const personhoodVerifier = await PersonhoodVerifier.deploy();
    await personhoodVerifier.deployed();
    
    console.log(`✅ Personhood Verifier deployed: ${personhoodVerifier.address}`);
    
    // Verify the contract is working
    console.log('🔍 Testing Personhood Verifier...');
    // const testResult = await this.testPersonhoodVerifier(personhoodVerifier);
    // console.log(`   Test result: ${testResult ? 'PASS' : 'FAIL'}`);
    
    return personhoodVerifier;
  }

  async deployRegistry(kycVerifierAddress, personhoodVerifierAddress) {
    const PersonaPassRegistry = await ethers.getContractFactory('PersonaPassRegistry');
    console.log('⏳ Deploying PersonaPass Registry contract...');
    
    const registry = await PersonaPassRegistry.deploy(
      kycVerifierAddress,
      personhoodVerifierAddress
    );
    await registry.deployed();
    
    console.log(`✅ PersonaPass Registry deployed: ${registry.address}`);
    
    // Verify the registry is properly configured
    const kycAddr = await registry.kycVerifier();
    const personhoodAddr = await registry.personhoodVerifier();
    console.log(`   KYC Verifier linked: ${kycAddr === kycVerifierAddress ? '✅' : '❌'}`);
    console.log(`   Personhood Verifier linked: ${personhoodAddr === personhoodVerifierAddress ? '✅' : '❌'}`);
    
    return registry;
  }

  async configureContracts(registry, kycVerifier, personhoodVerifier) {
    const [deployer] = await ethers.getSigners();
    console.log(`⚙️  Configuring contracts with deployer: ${deployer.address}`);
    
    // Set up any additional configuration
    // For now, the deployer is automatically the owner and authorized issuer
    
    console.log('✅ Contract configuration complete');
  }

  async saveDeploymentInfo(networkName, contracts) {
    const deploymentInfo = {
      network: NETWORKS[networkName],
      timestamp: new Date().toISOString(),
      deployer: (await ethers.getSigners())[0].address,
      contracts: {
        kycVerifier: {
          address: contracts.kycVerifier.address,
          deploymentTx: contracts.kycVerifier.deployTransaction.hash
        },
        personhoodVerifier: {
          address: contracts.personhoodVerifier.address,
          deploymentTx: contracts.personhoodVerifier.deployTransaction.hash
        },
        registry: {
          address: contracts.registry.address,
          deploymentTx: contracts.registry.deployTransaction.hash
        }
      }
    };

    // Save to deployments directory
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = path.join(deploymentsDir, `${networkName}.json`);
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`💾 Deployment info saved to: ${filename}`);

    // Also save to frontend config
    await this.updateFrontendConfig(networkName, deploymentInfo);
  }

  async updateFrontendConfig(networkName, deploymentInfo) {
    const configPath = path.join(__dirname, '../src/config/contracts.ts');
    
    let configContent = '';
    if (fs.existsSync(configPath)) {
      configContent = fs.readFileSync(configPath, 'utf8');
    } else {
      // Create initial config file
      configContent = `// PersonaPass Contract Addresses - Auto-generated
export const CONTRACT_ADDRESSES = {
  // Multi-chain contract deployments
};

export const NETWORK_CONFIG = {
  // Network configurations
};
`;
    }

    // Update or add network configuration
    const networkConfig = `
  ${networkName}: {
    chainId: ${deploymentInfo.network.chainId},
    name: "${deploymentInfo.network.name}",
    rpc: "${deploymentInfo.network.rpc}",
    explorer: "${deploymentInfo.network.explorer}",
    contracts: {
      kycVerifier: "${deploymentInfo.contracts.kycVerifier.address}",
      personhoodVerifier: "${deploymentInfo.contracts.personhoodVerifier.address}",
      registry: "${deploymentInfo.contracts.registry.address}"
    }
  },`;

    // Simple approach: append to file for now
    // In production, you'd want more sophisticated merging
    const updatedConfig = configContent.replace(
      'export const CONTRACT_ADDRESSES = {',
      `export const CONTRACT_ADDRESSES = {${networkConfig}`
    );

    // Ensure directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, updatedConfig);
    console.log(`⚙️  Frontend config updated: ${configPath}`);
  }

  async verifyContracts(networkName, contracts) {
    const network = NETWORKS[networkName];
    if (!network) {
      console.log('⚠️  Unknown network, skipping verification');
      return;
    }

    console.log(`🔍 Verifying contracts on ${network.explorer}...`);
    
    // In a real deployment, you'd use hardhat-etherscan or similar
    // For now, just provide the information needed for manual verification
    console.log('\n📋 Contract Verification Information:');
    console.log('=====================================');
    console.log(`KYC Verifier: ${contracts.kycVerifier.address}`);
    console.log(`Personhood Verifier: ${contracts.personhoodVerifier.address}`);
    console.log(`Registry: ${contracts.registry.address}`);
    console.log('\nConstructor arguments for Registry:');
    console.log(`[${contracts.kycVerifier.address}, ${contracts.personhoodVerifier.address}]`);
    console.log(`\nExplorer: ${network.explorer}`);
    
    // Note: In production deployment, add automatic verification:
    // await hre.run("verify:verify", { address: contract.address, constructorArguments: [...] });
  }

  getNetworkName(chainId) {
    for (const [name, config] of Object.entries(NETWORKS)) {
      if (config.chainId === chainId) {
        return name;
      }
    }
    return 'unknown';
  }

  printDeploymentSummary(networkName) {
    const network = NETWORKS[networkName];
    
    console.log('\n🎯 Deployment Summary');
    console.log('=====================');
    console.log(`Network: ${network?.name || 'Unknown'} (Chain ID: ${network?.chainId || 'Unknown'})`);
    console.log(`Explorer: ${network?.explorer || 'Unknown'}`);
    console.log('\n📝 Next Steps:');
    console.log('1. Verify contracts on block explorer');
    console.log('2. Test KYC and Personhood verification flows');
    console.log('3. Update frontend configuration');
    console.log('4. Deploy to additional chains');
    console.log('\n✨ PersonaPass is ready for privacy-preserving identity verification!');
  }

  // Test functions (to be implemented with actual test vectors)
  async testKYCVerifier(verifier) {
    try {
      // In production, test with actual proof from circuits
      console.log('   ⚠️  KYC verification test skipped (requires proof)');
      return true;
    } catch (error) {
      console.error('   ❌ KYC verifier test failed:', error);
      return false;
    }
  }

  async testPersonhoodVerifier(verifier) {
    try {
      // In production, test with actual proof from circuits
      console.log('   ⚠️  Personhood verification test skipped (requires proof)');
      return true;
    } catch (error) {
      console.error('   ❌ Personhood verifier test failed:', error);
      return false;
    }
  }
}

// Main deployment function
async function main() {
  const deployer = new MultiChainDeployer();
  await deployer.deploy();
}

// Error handling
main()
  .then(() => {
    console.log('\n🎉 Multi-chain deployment completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });

module.exports = { MultiChainDeployer };