/**
 * PersonaID (PID) Token Deployment Script
 */

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 PersonaID Token Deployment Starting...');
  console.log('=============================================');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`💰 Deployer: ${deployer.address}`);
  console.log(`💵 Balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);

  // Deploy SimplePersonaToken
  console.log('\n🪙 Deploying PersonaID Token...');
  
  const PersonaToken = await ethers.getContractFactory('SimplePersonaToken');
  const pidToken = await PersonaToken.deploy();
  
  await pidToken.waitForDeployment();
  
  console.log(`✅ PID Token deployed: ${await pidToken.getAddress()}`);
  console.log(`📄 Transaction: ${pidToken.deploymentTransaction().hash}`);
  
  // Verify contract details
  const name = await pidToken.name();
  const symbol = await pidToken.symbol();
  const decimals = await pidToken.decimals();
  const totalSupply = await pidToken.totalSupply();
  const deployerBalance = await pidToken.balanceOf(deployer.address);
  const contractAddress = await pidToken.getAddress();
  
  console.log('\n📊 Token Details:');
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Decimals: ${decimals}`);
  console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} PID`);
  console.log(`   Deployer Balance: ${ethers.formatEther(deployerBalance)} PID`);

  // Save deployment info
  const deploymentInfo = {
    network: {
      name: network.name || `chain-${network.chainId}`,
      chainId: Number(network.chainId)
    },
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    pidToken: {
      address: contractAddress,
      deploymentTx: pidToken.deploymentTransaction().hash,
      name: name,
      symbol: symbol,
      decimals: Number(decimals),
      totalSupply: ethers.formatEther(totalSupply)
    }
  };

  // Create deployments directory
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment record
  const networkName = network.name || `chain-${network.chainId}`;
  const filename = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved: ${filename}`);

  // Create frontend config
  const configDir = path.join(__dirname, '../src/config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const config = `// PersonaID Token Configuration - Auto-generated
// Generated on: ${new Date().toISOString()}

export const PID_TOKEN_CONFIG = {
  address: "${contractAddress}",
  name: "${name}",
  symbol: "${symbol}",
  decimals: ${Number(decimals)},
  
  network: {
    name: "${networkName}",
    chainId: ${Number(network.chainId)}
  },
  
  rewards: {
    verificationReward: "10",    // 10 PID per verification
    firstTimeBonus: "20",        // 20 PID for first verification
    monthlyKYCReward: "100",     // 100 PID monthly KYC reward
    stakingRate: 800             // 8% base APY
  }
};

export const PID_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function stake(uint256)",
  "function unstake(uint256)",
  "function getTotalStaked(address) view returns (uint256)",
  "function getTotalPendingRewards(address) view returns (uint256)",
  "function canClaimMonthlyKYC(address) view returns (bool)",
  "function distributeVerificationReward(address,string)",
  "function distributeMonthlyKYCReward(address)",
  "event Transfer(address indexed,address indexed,uint256)",
  "event VerificationReward(address indexed,uint256,string)"
];
`;

  fs.writeFileSync(path.join(configDir, 'token.ts'), config);
  console.log(`⚙️ Frontend config created: ${path.join(configDir, 'token.ts')}`);

  console.log('\n🎯 Deployment Summary');
  console.log('====================');
  console.log(`✅ PID Token: ${contractAddress}`);
  console.log(`✅ Initial Supply: 100M PID tokens`);
  console.log(`✅ Staking: 8% base APY enabled`);
  console.log(`✅ Verification Rewards: 10/20 PID per verification`);
  console.log(`✅ Monthly KYC Rewards: 100 PID per month`);

  console.log('\n📝 Next Steps:');
  console.log('1. 🔍 Verify contract on block explorer');
  console.log('2. 💧 Create DEX liquidity pool');
  console.log('3. 📋 Submit to CoinGecko/CoinMarketCap');
  console.log('4. 🌐 Update frontend with token address');
  console.log('5. 🧪 Test token functionality');

  console.log('\n✨ PID Token deployment completed successfully! 🎉');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });