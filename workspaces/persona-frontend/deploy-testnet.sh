#!/bin/bash

# 🚀 PersonaID Token Testnet Deployment Script
# Deploys PID token to Polygon Mumbai testnet using public RPC

echo "🚀 PersonaID Token - Testnet Deployment"
echo "========================================"
echo ""

# Check if .env.deployment exists
if [ ! -f ".env.deployment" ]; then
    echo "⚠️  Creating .env.deployment with public testnet configuration..."
    
    cat > .env.deployment << EOF
# Public testnet deployment configuration
# Using public RPCs - no API keys needed for testing

# Polygon Mumbai testnet public RPC
ALCHEMY_API_KEY=demo_key

# Demo private key (funded testnet wallet)
# ⚠️  NEVER use this for mainnet - testnet only!
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Block explorer API keys (optional for verification)
POLYGONSCAN_API_KEY=YourApiKeyToken

# Gas reporting
REPORT_GAS=false
EOF

    echo "✅ Created .env.deployment with testnet configuration"
fi

echo "🔧 Compiling contracts..."
npx hardhat compile

echo ""
echo "🚀 Deploying PID Token to Polygon Mumbai..."
echo "Network: Polygon Mumbai (Chain ID: 80001)"
echo "RPC: https://rpc-mumbai.maticvigil.com"
echo ""

# Deploy to Mumbai testnet
npx hardhat run scripts/deploy-pid-token.js --network mumbai

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Check contract on https://mumbai.polygonscan.com"
echo "2. Add Mumbai testnet MATIC from faucet"
echo "3. Test token functions"
echo "4. Create liquidity pool on QuickSwap"
echo ""