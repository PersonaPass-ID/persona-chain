#!/bin/bash

# PersonaChain Validator Deployment Script
# Deploy the working PersonaChain binary to all 4 validators

set -e

VALIDATORS=(
  "13.221.89.96"
  "16.171.54.202"
  "54.169.98.156"
  "3.104.81.17"
)

BINARY_PATH="./build/personachaind"
CHAIN_ID="personachain-1"

echo "🚀 Deploying PersonaChain to ${#VALIDATORS[@]} validators..."

# Deploy binary to all validators in parallel
for validator_ip in "${VALIDATORS[@]}"; do
    echo "📦 Deploying to validator $validator_ip..."
    
    # Deploy binary
    scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
        "$BINARY_PATH" "ubuntu@$validator_ip:/home/ubuntu/personachaind" &
done

# Wait for all deployments to complete
wait

echo "✅ Binary deployment completed!"

# Initialize each validator
for i in "${!VALIDATORS[@]}"; do
    validator_ip="${VALIDATORS[$i]}"
    validator_name="validator-$((i+1))"
    
    echo "🔧 Initializing $validator_name at $validator_ip..."
    
    ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 "ubuntu@$validator_ip" << EOF
        # Make binary executable
        chmod +x /home/ubuntu/personachaind
        
        # Clean any existing config
        rm -rf /home/ubuntu/.personachain
        
        # Initialize validator
        ./personachaind init "$validator_name" --chain-id "$CHAIN_ID" --home /home/ubuntu/.personachain
        
        # Test that it works
        ./personachaind version
        
        echo "✅ $validator_name initialized successfully!"
EOF
done

echo ""
echo "🎉 ALL VALIDATORS DEPLOYED AND INITIALIZED!"
echo "📊 Deployment Summary:"
echo "   - Validators: ${#VALIDATORS[@]}"
echo "   - Chain ID: $CHAIN_ID"
echo "   - Binary: PersonaChain with DID, Credential, ZKProof modules"
echo ""