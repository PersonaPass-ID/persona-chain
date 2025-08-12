# 🚀 PersonaID Token Deployment Guide

## Current Status

✅ **LOCAL DEPLOYMENT COMPLETE**
- PID Token deployed to Hardhat local network
- Contract Address: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- Initial Supply: 100M PID tokens
- Features: Staking (8% APY), Verification Rewards, Monthly KYC Rewards

## Next: Deploy to Testnet/Mainnet

### Step 1: Setup Environment

1. **Get Alchemy API Key** (Free)
   - Visit: https://alchemy.com
   - Create account & get API key
   - Free tier includes 300M requests/month

2. **Create Deployment Wallet**
   ⚠️ **SECURITY**: Use a dedicated wallet, NOT your main wallet
   - Generate new wallet for deployments only
   - Fund it with testnet ETH from faucets

3. **Configure Environment**
   ```bash
   cp .env.deployment.example .env.deployment
   # Edit .env.deployment with your keys
   ```

### Step 2: Deploy to Testnet (Sepolia)

```bash
# Deploy to Sepolia testnet
npx hardhat run scripts/deploy-pid-token.js --network sepolia

# Verify contract on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Step 3: Deploy to Mainnet (Production)

```bash
# Deploy to Ethereum mainnet
npx hardhat run scripts/deploy-pid-token.js --network mainnet

# Verify contract on Etherscan
npx hardhat verify --network mainnet <CONTRACT_ADDRESS>
```

## Deployment Features

### PID Token Features
- ✅ ERC-20 Compatible
- ✅ Staking System (8% base APY)
- ✅ Verification Rewards (10/20 PID per verification)  
- ✅ Monthly KYC Rewards (100 PID/month)
- ✅ Role-based Access Control
- ✅ Pause/Unpause Functionality

### Post-Deployment Tasks
1. 🔍 Verify contract on block explorer
2. 💧 Create DEX liquidity pool (Uniswap/SushiSwap)
3. 📋 Submit to CoinGecko/CoinMarketCap
4. 🌐 Update frontend with contract address
5. 🧪 Test all token functions

### Network Configurations

| Network | Chain ID | Gas Token | Block Explorer |
|---------|----------|-----------|----------------|
| Sepolia | 11155111 | SepoliaETH | https://sepolia.etherscan.io |
| Ethereum | 1 | ETH | https://etherscan.io |
| Polygon | 137 | MATIC | https://polygonscan.com |
| Arbitrum | 42161 | ETH | https://arbiscan.io |

### Cost Estimates

| Network | Deploy Cost | Verify Cost |
|---------|-------------|-------------|
| Sepolia | ~$0 (testnet) | Free |
| Ethereum | ~$50-200 | ~$10 |
| Polygon | ~$0.01-0.1 | ~$1 |
| Arbitrum | ~$1-5 | ~$2 |

## Security Checklist

- [ ] Use dedicated deployment wallet
- [ ] Verify contract on block explorer
- [ ] Test all functions on testnet first
- [ ] Multi-sig for admin roles (production)
- [ ] Timelock for critical functions
- [ ] Audit smart contracts (production)

## Support

Need help? Check the deployment logs in `/deployments/` directory for details.