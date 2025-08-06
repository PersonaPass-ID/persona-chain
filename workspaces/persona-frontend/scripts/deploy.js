const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 PersonaID Token Deployment Starting...');
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`💰 Deployer: ${deployer.address}`);
  console.log(`💵 Balance: ${ethers.formatEther(await deployer.getBalance())} ETH`);

  // Deploy SimplePersonaToken
  console.log('\n🪙 Deploying PersonaID Token...');
  
  const PersonaToken = await ethers.getContractFactory('SimplePersonaToken');
  const pidToken = await PersonaToken.deploy();
  
  await pidToken.deployed();
  
  console.log(`✅ PID Token deployed: ${pidToken.address}`);
  console.log(`📄 Transaction: ${pidToken.deployTransaction.hash}`);
  
  // Verify contract details
  const name = await pidToken.name();
  const symbol = await pidToken.symbol();
  const decimals = await pidToken.decimals();
  const totalSupply = await pidToken.totalSupply();
  const deployerBalance = await pidToken.balanceOf(deployer.address);
  
  console.log('\n📊 Token Details:');
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Decimals: ${decimals}`);
  console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} PID`);
  console.log(`   Deployer Balance: ${ethers.formatEther(deployerBalance)} PID`);

  // Create frontend config
  const configDir = path.join(__dirname, '../src/config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const config = \`// PersonaID Token Configuration
export const PID_TOKEN_CONFIG = {
  address: "\${pidToken.address}",
  name: "\${name}",
  symbol: "\${symbol}",
  decimals: \${decimals},
  
  network: {
    name: "\${network.name || \`chain-\${network.chainId}\`}",
    chainId: \${network.chainId}
  },
  
  rewards: {
    verificationReward: "10",
    firstTimeBonus: "20", 
    monthlyKYCReward: "100",
    stakingRate: 800
  }
};

export const PID_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)", 
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function stake(uint256)",
  "function unstake(uint256)",
  "function getTotalStaked(address) view returns (uint256)",
  "function distributeVerificationReward(address,string)",
  "function distributeMonthlyKYCReward(address)"
];
\`;

  fs.writeFileSync(path.join(configDir, 'token.ts'), config);
  console.log(\`⚙️ Frontend config created\`);

  console.log('\\n✨ PID Token deployment completed successfully! 🎉');
  console.log(\`Contract address: \${pidToken.address}\`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });