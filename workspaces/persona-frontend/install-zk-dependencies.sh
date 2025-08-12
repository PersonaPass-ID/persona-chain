#!/bin/bash

# PersonaPass ZK Proof System Dependencies Installation
echo "🔬 Installing PersonaPass ZK Proof System Dependencies..."
echo "========================================================="

# Core ZK Dependencies
echo "📦 Installing core ZK libraries..."
npm install --save \
    circomlibjs@^0.1.1 \
    snarkjs@^0.7.3 \
    ethers@^5.7.2 \
    poseidon-lite@^0.2.0 \
    @cosmjs/stargate@^0.32.3 \
    @cosmjs/proto-signing@^0.32.3 \
    @cosmjs/amino@^0.32.3

# Development Dependencies for Smart Contracts
echo "🔨 Installing smart contract development tools..."
npm install --save-dev \
    hardhat@^2.19.4 \
    @nomiclabs/hardhat-ethers@^2.2.3 \
    @nomiclabs/hardhat-etherscan@^3.1.8 \
    @typechain/hardhat@^9.1.0 \
    typechain@^8.3.2

# Global Tools (if not already installed)
echo "🌐 Installing global circuit tools..."
if ! command -v circom &> /dev/null; then
    echo "Installing circom..."
    npm install -g circom@latest
fi

if ! command -v snarkjs &> /dev/null; then
    echo "Installing snarkjs..."
    npm install -g snarkjs@latest
fi

# Create necessary directories
echo "📁 Creating circuit directories..."
mkdir -p circuits/build
mkdir -p public/circuits
mkdir -p deployments

# Make scripts executable
echo "⚙️  Setting script permissions..."
chmod +x circuits/compile.sh
chmod +x scripts/deploy-multichain.js

echo ""
echo "✅ PersonaPass ZK Proof System Dependencies Installed!"
echo "======================================================"
echo ""
echo "📋 Next Steps:"
echo "1. Add your private key to .env file:"
echo "   DEPLOYER_PRIVATE_KEY=0x..."
echo ""
echo "2. Configure network RPC endpoints in .env:"
echo "   POLYGON_RPC=https://polygon-rpc.com"
echo "   ARBITRUM_RPC=https://arb1.arbitrum.io/rpc"
echo "   BSC_RPC=https://bsc-dataseed1.binance.org"
echo ""
echo "3. Compile ZK circuits:"
echo "   cd circuits && ./compile.sh"
echo ""
echo "4. Deploy smart contracts:"
echo "   npx hardhat run scripts/deploy-multichain.js --network polygon"
echo ""
echo "5. Test the complete system:"
echo "   npm run test:zk"
echo ""
echo "🚀 Ready to deploy your privacy-preserving identity system!"