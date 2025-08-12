/**
 * PersonaID (PID) Token Deployment Script
 * 
 * Deploys the PID token and creates DEX liquidity pool
 * Sets up initial token distribution and trading capabilities
 */

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// Network configurations
const UNISWAP_V2_FACTORY = {
  mainnet: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
  sepolia: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Testnet factory
  polygon: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
  arbitrum: "0xf1D7CC64Fb4452F05c498126312eBE29f30Fbcf9"
};

const UNISWAP_V2_ROUTER = {
  mainnet: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  sepolia: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Testnet router
  polygon: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
  arbitrum: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24"
};

const WETH_ADDRESSES = {
  mainnet: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  sepolia: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
  polygon: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
  arbitrum: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
};

class TokenDeployer {
  constructor() {
    this.deploymentResults = {};
  }

  async deploy() {
    console.log('🚀 PersonaID Token Deployment Starting...');
    console.log('=============================================');

    // Get network info
    const network = await ethers.provider.getNetwork();
    const networkName = this.getNetworkName(network.chainId);
    const [deployer] = await ethers.getSigners();
    
    console.log(`📍 Network: ${networkName} (Chain ID: ${network.chainId})`);
    console.log(`💰 Deployer: ${deployer.address}`);
    console.log(`💵 Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

    try {
      // 1. Deploy PID Token Contract
      console.log('\n🪙 Step 1: Deploying PersonaID Token...');
      const pidToken = await this.deployPIDToken();
      
      // 2. Create Uniswap Pair
      console.log('\n🔄 Step 2: Creating Uniswap V2 Pair...');
      const pairInfo = await this.createUniswapPair(pidToken, networkName);
      
      // 3. Add Initial Liquidity
      console.log('\n💧 Step 3: Adding Initial Liquidity...');
      const liquidityInfo = await this.addInitialLiquidity(pidToken, networkName);
      
      // 4. Setup Token Configuration
      console.log('\n⚙️ Step 4: Setting up token configuration...');
      await this.setupTokenConfig(pidToken);
      
      // 5. Save Deployment Info
      console.log('\n💾 Step 5: Saving deployment information...');
      await this.saveDeploymentInfo(networkName, {
        pidToken,
        pairInfo,
        liquidityInfo,
        deployer: deployer.address
      });
      
      // 6. Create Frontend Config
      console.log('\n🌐 Step 6: Creating frontend configuration...');
      await this.createFrontendConfig(networkName, pidToken, pairInfo);
      
      console.log('\n🎉 Token Deployment Complete!');
      this.printDeploymentSummary(networkName, pidToken, pairInfo);
      
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      throw error;
    }
  }

  async deployPIDToken() {
    const PersonaTokenomics = await ethers.getContractFactory('PersonaTokenomics');
    console.log('⏳ Deploying PersonaID Token contract...');
    
    const pidToken = await PersonaTokenomics.deploy();
    await pidToken.deployed();
    
    console.log(`✅ PID Token deployed: ${pidToken.address}`);
    
    // Verify basic functionality
    const name = await pidToken.name();
    const symbol = await pidToken.symbol();
    const totalSupply = await pidToken.totalSupply();
    const maxSupply = await pidToken.MAX_SUPPLY();
    
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Initial Supply: ${ethers.utils.formatEther(totalSupply)} PID`);
    console.log(`   Max Supply: ${ethers.utils.formatEther(maxSupply)} PID`);
    
    return pidToken;
  }

  async createUniswapPair(pidToken, networkName) {
    try {
      const factoryAddress = UNISWAP_V2_FACTORY[networkName];
      const wethAddress = WETH_ADDRESSES[networkName];
      
      if (!factoryAddress || !wethAddress) {
        console.log('⚠️ Uniswap not available on this network, skipping pair creation');
        return { address: null, wethAddress: null };
      }

      console.log(`   Using Factory: ${factoryAddress}`);
      console.log(`   WETH Address: ${wethAddress}`);

      // Get factory contract
      const factoryABI = [
        "function createPair(address tokenA, address tokenB) external returns (address pair)",
        "function getPair(address tokenA, address tokenB) external view returns (address pair)"
      ];
      
      const factory = new ethers.Contract(factoryAddress, factoryABI, await ethers.getSigner());
      
      // Check if pair already exists
      let pairAddress = await factory.getPair(pidToken.address, wethAddress);
      
      if (pairAddress === ethers.constants.AddressZero) {
        console.log('   Creating new PID/WETH pair...');
        const tx = await factory.createPair(pidToken.address, wethAddress);
        await tx.wait();
        
        pairAddress = await factory.getPair(pidToken.address, wethAddress);
      } else {
        console.log('   Pair already exists');
      }
      
      console.log(`✅ PID/WETH Pair: ${pairAddress}`);
      
      return {
        address: pairAddress,
        wethAddress: wethAddress,
        factoryAddress: factoryAddress
      };
      
    } catch (error) {
      console.log(`⚠️ Failed to create Uniswap pair: ${error.message}`);
      return { address: null, wethAddress: null };
    }
  }

  async addInitialLiquidity(pidToken, networkName) {
    try {
      const routerAddress = UNISWAP_V2_ROUTER[networkName];
      const wethAddress = WETH_ADDRESSES[networkName];
      
      if (!routerAddress || !wethAddress) {
        console.log('⚠️ Uniswap router not available, skipping liquidity provision');
        return null;
      }

      const [deployer] = await ethers.getSigners();
      const deployerBalance = await deployer.getBalance();
      
      // Check if we have enough ETH for liquidity (need at least 0.1 ETH)
      const minETH = ethers.utils.parseEther("0.1");
      if (deployerBalance.lt(minETH)) {
        console.log('⚠️ Insufficient ETH balance for liquidity provision');
        return null;
      }

      const routerABI = [
        "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)"
      ];
      
      const router = new ethers.Contract(routerAddress, routerABI, deployer);
      
      // Amounts for initial liquidity
      const pidAmount = ethers.utils.parseEther("10000"); // 10K PID tokens
      const ethAmount = ethers.utils.parseEther("0.05");   // 0.05 ETH
      
      // Check PID balance
      const pidBalance = await pidToken.balanceOf(deployer.address);
      if (pidBalance.lt(pidAmount)) {
        console.log(`⚠️ Insufficient PID balance. Have: ${ethers.utils.formatEther(pidBalance)}, Need: ${ethers.utils.formatEther(pidAmount)}`);
        return null;
      }
      
      console.log(`   Adding liquidity: ${ethers.utils.formatEther(pidAmount)} PID + ${ethers.utils.formatEther(ethAmount)} ETH`);
      
      // Approve router to spend PID tokens
      console.log('   Approving PID tokens...');
      const approveTx = await pidToken.approve(routerAddress, pidAmount);
      await approveTx.wait();
      
      // Add liquidity
      console.log('   Adding liquidity to Uniswap...');
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      
      const liquidityTx = await router.addLiquidityETH(
        pidToken.address,
        pidAmount,
        pidAmount.mul(95).div(100), // 5% slippage
        ethAmount.mul(95).div(100),  // 5% slippage
        deployer.address,
        deadline,
        { value: ethAmount }
      );
      
      const receipt = await liquidityTx.wait();
      console.log(`✅ Liquidity added! TX: ${receipt.transactionHash}`);
      
      return {
        pidAmount: ethers.utils.formatEther(pidAmount),
        ethAmount: ethers.utils.formatEther(ethAmount),
        txHash: receipt.transactionHash
      };
      
    } catch (error) {
      console.log(`⚠️ Failed to add liquidity: ${error.message}`);
      return null;
    }
  }

  async setupTokenConfig(pidToken) {
    const [deployer] = await ethers.getSigners();
    
    console.log('   Setting up roles and permissions...');
    
    // Grant verifier role to deployer for testing
    const VERIFIER_ROLE = await pidToken.VERIFIER_ROLE();
    const hasVerifierRole = await pidToken.hasRole(VERIFIER_ROLE, deployer.address);
    
    if (!hasVerifierRole) {
      console.log('   Granting VERIFIER_ROLE to deployer...');
      const tx = await pidToken.grantRole(VERIFIER_ROLE, deployer.address);
      await tx.wait();
    }
    
    console.log('✅ Token configuration complete');
  }

  async saveDeploymentInfo(networkName, deployment) {
    const deploymentInfo = {
      network: {
        name: networkName,
        chainId: (await ethers.provider.getNetwork()).chainId
      },
      timestamp: new Date().toISOString(),
      deployer: deployment.deployer,
      contracts: {
        pidToken: {
          address: deployment.pidToken.address,
          deploymentTx: deployment.pidToken.deployTransaction.hash
        }
      },
      uniswap: {
        pair: deployment.pairInfo.address,
        wethAddress: deployment.pairInfo.wethAddress,
        factoryAddress: deployment.pairInfo.factoryAddress
      },
      liquidity: deployment.liquidityInfo
    };

    // Create deployments directory
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = path.join(deploymentsDir, `${networkName}.json`);
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`💾 Deployment info saved: ${filename}`);
  }

  async createFrontendConfig(networkName, pidToken, pairInfo) {
    const configDir = path.join(__dirname, '../src/config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const configPath = path.join(configDir, 'token.ts');
    const network = await ethers.provider.getNetwork();
    
    const config = `// PersonaID Token Configuration - Auto-generated
// Generated on: ${new Date().toISOString()}

export const PID_TOKEN_CONFIG = {
  address: "${pidToken.address}",
  name: "PersonaID Token",
  symbol: "PID",
  decimals: 18,
  
  // Network info
  network: {
    name: "${networkName}",
    chainId: ${network.chainId}
  },
  
  // Uniswap info
  uniswap: {
    pairAddress: "${pairInfo.address || 'Not available'}",
    wethAddress: "${pairInfo.wethAddress || 'Not available'}",
    routerAddress: "${UNISWAP_V2_ROUTER[networkName] || 'Not available'}"
  },
  
  // Token economics
  maxSupply: "1000000000", // 1B tokens
  initialSupply: "100000000", // 100M tokens
  
  // Reward configuration
  rewards: {
    verificationReward: "10", // 10 PID per verification
    firstTimeBonus: "20", // 20 PID for first verification
    stakingRate: 800, // 8% base APY
    monthlyLimit: "100" // 100 PID monthly limit for KYC users
  }
};

export const VERIFICATION_REWARDS = {
  FIRST_TIME: "20", // Double reward for first verification
  STANDARD: "10",   // Standard verification reward
  KYC_MONTHLY: "100", // Monthly KYC completion reward
  PROOF_OF_PERSONHOOD: "25" // Base proof of personhood reward
};

// Contract ABI (essential functions only)
export const PID_TOKEN_ABI = [
  // Read functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  
  // Write functions
  "function transfer(address,uint256) returns (bool)",
  "function transferFrom(address,address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)",
  
  // Staking functions
  "function stake(uint256,uint256)",
  "function unstake(uint256)",
  "function getTotalStaked(address) view returns (uint256)",
  "function getTotalPendingRewards(address) view returns (uint256)",
  
  // Verification rewards
  "function distributeVerificationReward(address,string)",
  
  // Events
  "event Transfer(address indexed,address indexed,uint256)",
  "event Approval(address indexed,address indexed,uint256)",
  "event Staked(address indexed,uint256,uint256,uint256)",
  "event VerificationReward(address indexed,uint256,string)"
];
`;

    fs.writeFileSync(configPath, config);
    console.log(`⚙️ Frontend config created: ${configPath}`);
  }

  getNetworkName(chainId) {
    const networks = {
      1: 'mainnet',
      11155111: 'sepolia',
      137: 'polygon',
      42161: 'arbitrum',
      31337: 'hardhat'
    };
    return networks[chainId] || 'unknown';
  }

  printDeploymentSummary(networkName, pidToken, pairInfo) {
    console.log('\n🎯 Deployment Summary');
    console.log('====================');
    console.log(`Network: ${networkName}`);
    console.log(`PID Token: ${pidToken.address}`);
    if (pairInfo.address) {
      console.log(`Uniswap Pair: ${pairInfo.address}`);
    }
    
    console.log('\n📝 Next Steps:');
    console.log('1. 🔍 Verify contract on block explorer');
    console.log('2. 📋 Submit token info to CoinGecko/CoinMarketCap');
    console.log('3. 🌐 Update frontend with token address');
    console.log('4. 🧪 Test token functionality');
    console.log('5. 🎁 Setup monthly reward distribution');
    
    console.log('\n✨ PID Token is ready for trading!');
    
    if (pairInfo.address) {
      console.log(`\n💱 Trade PID tokens on Uniswap:`);
      console.log(`   Pair: ${pairInfo.address}`);
      console.log(`   Add to wallet: ${pidToken.address}`);
    }
  }
}

// Main deployment function
async function main() {
  const deployer = new TokenDeployer();
  await deployer.deploy();
}

// Error handling
main()
  .then(() => {
    console.log('\n🎉 PID Token deployment completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });

module.exports = { TokenDeployer };