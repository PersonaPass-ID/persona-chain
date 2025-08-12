#!/bin/bash

# Circuit Compilation Script for PersonaPass ZK Proofs
# Compiles Circom circuits for zero-knowledge proof generation

set -e

CIRCUITS_DIR="src/circuits"
COMPILED_DIR="src/circuits"

echo "🔧 Starting circuit compilation..."

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    echo "❌ circom not found. Installing circom..."
    
    # Install circom
    git clone https://github.com/iden3/circom.git /tmp/circom
    cd /tmp/circom
    cargo build --release
    cargo install --path circom
    
    echo "✅ circom installed successfully"
fi

# Check if circom is now available
if ! command -v circom &> /dev/null; then
    echo "❌ Failed to install circom. Please install manually:"
    echo "   https://docs.circom.io/getting-started/installation/"
    exit 1
fi

echo "📁 Compiling circuits in ${CIRCUITS_DIR}..."

# Compile age verification circuit
if [ -f "${CIRCUITS_DIR}/age_verification.circom" ]; then
    echo "🎂 Compiling age verification circuit..."
    circom "${CIRCUITS_DIR}/age_verification.circom" \
        --r1cs \
        --wasm \
        --sym \
        -o "${COMPILED_DIR}"
    
    echo "🔑 Generating proving key for age verification..."
    snarkjs powersoftau new bn128 12 "${COMPILED_DIR}/pot12_0000.ptau" -v
    snarkjs powersoftau contribute "${COMPILED_DIR}/pot12_0000.ptau" "${COMPILED_DIR}/pot12_0001.ptau" --name="First contribution" -v -e="random entropy"
    snarkjs powersoftau prepare phase2 "${COMPILED_DIR}/pot12_0001.ptau" "${COMPILED_DIR}/pot12_final.ptau" -v
    snarkjs groth16 setup "${COMPILED_DIR}/age_verification.r1cs" "${COMPILED_DIR}/pot12_final.ptau" "${COMPILED_DIR}/age_verification_0000.zkey"
    snarkjs zkey contribute "${COMPILED_DIR}/age_verification_0000.zkey" "${COMPILED_DIR}/age_verification.zkey" --name="1st Contributor Name" -v -e="Another random entropy"
    snarkjs zkey export verificationkey "${COMPILED_DIR}/age_verification.zkey" "${COMPILED_DIR}/age_verification.vkey.json"
    
    echo "✅ Age verification circuit compiled successfully"
else
    echo "⚠️ age_verification.circom not found, skipping..."
fi

# Compile jurisdiction proof circuit
if [ -f "${CIRCUITS_DIR}/jurisdiction_proof.circom" ]; then
    echo "🌍 Compiling jurisdiction proof circuit..."
    circom "${CIRCUITS_DIR}/jurisdiction_proof.circom" \
        --r1cs \
        --wasm \
        --sym \
        -o "${COMPILED_DIR}"
    
    echo "🔑 Generating proving key for jurisdiction proof..."
    snarkjs groth16 setup "${COMPILED_DIR}/jurisdiction_proof.r1cs" "${COMPILED_DIR}/pot12_final.ptau" "${COMPILED_DIR}/jurisdiction_proof_0000.zkey"
    snarkjs zkey contribute "${COMPILED_DIR}/jurisdiction_proof_0000.zkey" "${COMPILED_DIR}/jurisdiction_proof.zkey" --name="1st Contributor Name" -v -e="More random entropy"
    snarkjs zkey export verificationkey "${COMPILED_DIR}/jurisdiction_proof.zkey" "${COMPILED_DIR}/jurisdiction_proof.vkey.json"
    
    echo "✅ Jurisdiction proof circuit compiled successfully"
else
    echo "⚠️ jurisdiction_proof.circom not found, skipping..."
fi

# Clean up temporary files
echo "🧹 Cleaning up temporary files..."
rm -f "${COMPILED_DIR}"/*.ptau
rm -f "${COMPILED_DIR}"/*_0000.zkey
rm -f "${COMPILED_DIR}"/witness.wtns

echo "🎉 Circuit compilation completed successfully!"
echo ""
echo "📋 Generated files:"
ls -la "${COMPILED_DIR}"/*.{wasm,zkey,json} 2>/dev/null || echo "No compiled files found"
echo ""
echo "🚀 Ready to generate real zero-knowledge proofs!"