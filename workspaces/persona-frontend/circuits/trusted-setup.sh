#!/bin/bash

# PersonaPass ZKP Trusted Setup Ceremony Script
# This script performs the trusted setup for the age verification circuit

set -e

echo "🔐 PersonaPass ZKP Trusted Setup Ceremony"
echo "========================================="

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    echo "❌ circom is not installed. Installing..."
    npm install -g circom
fi

# Check if snarkjs is installed
if ! command -v snarkjs &> /dev/null; then
    echo "❌ snarkjs is not installed. Installing..."
    npm install -g snarkjs
fi

echo "📦 Step 1: Compiling circuit..."
circom age_verification.circom --r1cs --wasm --sym

echo "🎯 Step 2: Generating Powers of Tau..."
snarkjs powersoftau new bn128 14 pot14_0000.ptau -v

echo "🎲 Step 3: Contributing randomness..."
snarkjs powersoftau contribute pot14_0000.ptau pot14_0001.ptau --name="PersonaPass" -v

echo "🔒 Step 4: Phase 2 preparation..."
snarkjs powersoftau prepare phase2 pot14_0001.ptau pot14_final.ptau -v

echo "🔑 Step 5: Generating proving key..."
snarkjs groth16 setup age_verification.r1cs pot14_final.ptau age_verification_0000.zkey

echo "🎯 Step 6: Contributing to phase 2..."
snarkjs zkey contribute age_verification_0000.zkey age_verification_0001.zkey --name="PersonaPass Phase2" -v

echo "✅ Step 7: Exporting verification key..."
snarkjs zkey export verificationkey age_verification_0001.zkey verification_key.json

echo "📊 Step 8: Generating verifier contract..."
snarkjs zkey export solidityverifier age_verification_0001.zkey verifier.sol

echo "✨ Trusted setup complete!"
echo "Files generated:"
echo "  - age_verification.wasm (for proof generation)"
echo "  - age_verification_0001.zkey (proving key)"
echo "  - verification_key.json (for proof verification)"
echo "  - verifier.sol (on-chain verifier contract)"