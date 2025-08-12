#!/bin/bash

# ZK Circuit Compilation Script for PersonaPass
# Compiles KYC Verification and Proof of Personhood circuits

echo "🔬 PersonaPass ZK Circuit Compilation Starting..."
echo "=================================================="

# Check if circom and snarkjs are installed
if ! command -v circom &> /dev/null; then
    echo "❌ circom not found. Installing..."
    npm install -g circom
fi

if ! command -v snarkjs &> /dev/null; then
    echo "❌ snarkjs not found. Installing..."
    npm install -g snarkjs
fi

# Create circuits build directory
mkdir -p build
cd build

echo ""
echo "🎯 Step 1: Compiling KYC Verification Circuit"
echo "============================================="

# Compile KYC verification circuit
circom ../kyc_verification.circom --r1cs --wasm --sym --c --optimize
if [ $? -ne 0 ]; then
    echo "❌ KYC circuit compilation failed"
    exit 1
fi

echo "✅ KYC circuit compiled successfully"

echo ""
echo "🎯 Step 2: Compiling Proof of Personhood Circuit"
echo "==============================================="

# Compile Proof of Personhood circuit
circom ../proof_of_personhood.circom --r1cs --wasm --sym --c --optimize
if [ $? -ne 0 ]; then
    echo "❌ Proof of Personhood circuit compilation failed"
    exit 1
fi

echo "✅ Proof of Personhood circuit compiled successfully"

echo ""
echo "🎯 Step 3: Generating Trusted Setup (Phase 1)"
echo "============================================="

# Powers of Tau ceremony for both circuits
echo "⏳ Generating powers of tau (this may take several minutes)..."

# Start new ceremony
snarkjs powersoftau new bn128 18 pot18_0000.ptau -v

# Contribute to the ceremony (automated for development)
echo "🎲 Contributing randomness to ceremony..."
echo "PersonaPass Privacy-Preserving Identity Platform $(date)" | snarkjs powersoftau contribute pot18_0000.ptau pot18_0001.ptau --name="PersonaPass Development" -v

# Prepare phase 2
snarkjs powersoftau prepare phase2 pot18_0001.ptau pot18_final.ptau -v

echo "✅ Trusted setup phase 1 completed"

echo ""
echo "🎯 Step 4: Circuit-Specific Setup (Phase 2)"
echo "==========================================="

# KYC Verification Circuit Setup
echo "🔐 Setting up KYC verification circuit..."
snarkjs groth16 setup kyc_verification.r1cs pot18_final.ptau kyc_verification_0000.zkey
echo "PersonaPass KYC ZK Setup $(date)" | snarkjs zkey contribute kyc_verification_0000.zkey kyc_verification_0001.zkey --name="KYC Development" -v
snarkjs zkey export verificationkey kyc_verification_0001.zkey kyc_verification_vkey.json

# Proof of Personhood Circuit Setup  
echo "🔐 Setting up proof of personhood circuit..."
snarkjs groth16 setup proof_of_personhood.r1cs pot18_final.ptau proof_of_personhood_0000.zkey
echo "PersonaPass Personhood ZK Setup $(date)" | snarkjs zkey contribute proof_of_personhood_0000.zkey proof_of_personhood_0001.zkey --name="Personhood Development" -v
snarkjs zkey export verificationkey proof_of_personhood_0001.zkey proof_of_personhood_vkey.json

echo "✅ Circuit-specific setup completed"

echo ""
echo "🎯 Step 5: Generating Verification Contracts"
echo "==========================================="

# Generate Solidity verifier contracts
snarkjs zkey export solidityverifier kyc_verification_0001.zkey ../contracts/KYCVerifier.sol
snarkjs zkey export solidityverifier proof_of_personhood_0001.zkey ../contracts/PersonhoodVerifier.sol

echo "✅ Solidity verifier contracts generated"

echo ""
echo "🎯 Step 6: Copying Assets to Frontend"
echo "==================================="

# Copy WASM and verification keys to public directory
mkdir -p ../../public/circuits
cp kyc_verification.wasm ../../public/circuits/
cp kyc_verification_0001.zkey ../../public/circuits/kyc_verification_final.zkey
cp kyc_verification_vkey.json ../../public/circuits/

cp proof_of_personhood.wasm ../../public/circuits/
cp proof_of_personhood_0001.zkey ../../public/circuits/proof_of_personhood_final.zkey
cp proof_of_personhood_vkey.json ../../public/circuits/

echo "✅ Circuit artifacts copied to frontend"

echo ""
echo "🎯 Step 7: Generating Test Proofs"
echo "================================="

# Generate test inputs for validation
cat > kyc_test_input.json << EOF
{
  "documentHash": "12345678901234567890123456789012",
  "documentSalt": "98765432109876543210987654321098", 
  "documentType": "1",
  "nameHash": "11111111111111111111111111111111",
  "dobHash": "22222222222222222222222222222222",
  "addressHash": "33333333333333333333333333333333",
  "ssnHash": "44444444444444444444444444444444",
  "livenessProof": "55555555555555555555555555555555",
  "faceMatchScore": "95",
  "biometricNonce": "66666666666666666666666666666666",
  "providerPublicKey": ["77777777777777777777777777777777", "88888888888888888888888888888888"],
  "providerSignature": ["99999999999999999999999999999999", "10101010101010101010101010101010"],
  "providerTier": "4",
  "verificationDate": "1704067200",
  "expirationDate": "1735689600",
  "currentTimestamp": "1704067200",
  "requiredTier": "3",
  "requiredRegion": "1",
  "challengeNonce": "12121212121212121212121212121212"
}
EOF

# Test KYC circuit
echo "🧪 Testing KYC verification circuit..."
snarkjs groth16 fullprove kyc_test_input.json kyc_verification.wasm kyc_verification_0001.zkey kyc_proof.json kyc_public.json

# Verify the proof
snarkjs groth16 verify kyc_verification_vkey.json kyc_public.json kyc_proof.json
if [ $? -eq 0 ]; then
    echo "✅ KYC circuit test proof verification successful"
else
    echo "❌ KYC circuit test proof verification failed"
fi

echo ""
echo "🎉 ZK Circuit Compilation Complete!"
echo "==================================="
echo "📁 Circuit artifacts location:"
echo "   • Frontend: /public/circuits/"
echo "   • Contracts: /circuits/contracts/"
echo "   • Build files: /circuits/build/"
echo ""
echo "🔐 Security Note:"
echo "   This setup is for development only."
echo "   For production, run a proper trusted setup ceremony"
echo "   with multiple independent contributors."
echo ""
echo "✅ PersonaPass ZK infrastructure ready!"