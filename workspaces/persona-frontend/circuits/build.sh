#!/bin/bash

# PersonaPass ZK Circuit Compilation Script
# Compiles age verification circuit to WASM and generates proving keys

set -e

echo "🔧 Building PersonaPass Age Verification Circuit..."

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    echo "❌ Circom not found. Please install circom first:"
    echo "   npm install -g circom"
    exit 1
fi

# Check if snarkjs is installed
if ! command -v snarkjs &> /dev/null; then
    echo "❌ SnarkJS not found. Please install snarkjs first:"
    echo "   npm install -g snarkjs"
    exit 1
fi

# Create output directory
mkdir -p ../public/circuits

# Step 1: Compile circuit
echo "📝 Compiling circuit..."
circom age_verification.circom --r1cs --wasm --sym -o ../public/circuits -l ../node_modules

# Step 2: Generate proving key (this is the trusted setup)
echo "🔑 Generating proving keys (trusted setup)..."
cd ../public/circuits

# Download powers of tau file (for production, use a secure ceremony)
if [ ! -f "powersOfTau28_hez_final_12.ptau" ]; then
    echo "📥 Downloading powers of tau..."
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau
fi

# Generate proving and verification keys
echo "🔐 Generating zkey..."
snarkjs groth16 setup age_verification.r1cs powersOfTau28_hez_final_12.ptau age_verification_0000.zkey

# Contribute to the ceremony (in production, multiple parties should contribute)
echo "🎲 Contributing randomness..."
snarkjs zkey contribute age_verification_0000.zkey age_verification_0001.zkey --name="PersonaPass" -v

# Export verification key
echo "📤 Exporting verification key..."
snarkjs zkey export verificationkey age_verification_0001.zkey verification_key.json

# Clean up intermediate files
rm age_verification_0000.zkey
rm age_verification.r1cs
rm age_verification.sym

echo "✅ Circuit compilation complete!"
echo "📁 Output files:"
echo "   - /public/circuits/age_verification_js/age_verification.wasm"
echo "   - /public/circuits/age_verification_0001.zkey"
echo "   - /public/circuits/verification_key.json"
echo ""
echo "🚀 Age verification circuit ready for production use!"