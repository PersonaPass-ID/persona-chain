#!/bin/bash

echo "🚀 PersonaChain Validator Deployment Script"
echo "============================================"

# Configuration
CHAIN_ID="personachain-1"
MONIKER_PREFIX="persona-validator"
VALIDATORS=(
    "validator-01"
    "validator-02" 
    "validator-03"
    "validator-04"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Initialize each validator
init_validator() {
    local validator_name=$1
    local validator_index=$2
    
    log_info "Initializing $validator_name..."
    
    # Create validator directory
    mkdir -p "./validators/$validator_name"
    
    # Initialize the validator
    ./personachaind init "$validator_name" --chain-id "$CHAIN_ID" --home "./validators/$validator_name"
    
    if [ $? -eq 0 ]; then
        log_success "$validator_name initialized successfully"
    else
        log_error "Failed to initialize $validator_name"
        return 1
    fi
}

# Step 2: Create genesis file
create_genesis() {
    log_info "Creating genesis file..."
    
    # Use first validator as genesis validator
    local genesis_home="./validators/${VALIDATORS[0]}"
    
    # Add genesis accounts for all validators
    for i in "${!VALIDATORS[@]}"; do
        local validator="${VALIDATORS[$i]}"
        log_info "Adding genesis account for $validator..."
        
        # Create key for validator if it doesn't exist
        ./personachaind keys add "$validator" --keyring-backend test --home "$genesis_home" 2>/dev/null || true
        
        # Get validator address
        local validator_addr=$(./personachaind keys show "$validator" -a --keyring-backend test --home "$genesis_home")
        
        # Add genesis account with 1000000000persona tokens
        ./personachaind genesis add-genesis-account "$validator_addr" 1000000000persona --home "$genesis_home"
    done
    
    # Create genesis transaction for first validator
    ./personachaind genesis gentx "${VALIDATORS[0]}" 100000000persona \
        --chain-id "$CHAIN_ID" \
        --moniker "${VALIDATORS[0]}" \
        --keyring-backend test \
        --home "$genesis_home"
    
    # Collect genesis transactions
    ./personachaind genesis collect-gentxs --home "$genesis_home"
    
    log_success "Genesis file created"
}

# Step 3: Copy genesis to all validators
distribute_genesis() {
    log_info "Distributing genesis file to all validators..."
    
    local genesis_file="./validators/${VALIDATORS[0]}/config/genesis.json"
    
    for validator in "${VALIDATORS[@]:1}"; do
        cp "$genesis_file" "./validators/$validator/config/genesis.json"
        log_success "Genesis copied to $validator"
    done
}

# Step 4: Configure validators
configure_validators() {
    log_info "Configuring validators..."
    
    # Configure each validator
    for i in "${!VALIDATORS[@]}"; do
        local validator="${VALIDATORS[$i]}"
        local validator_home="./validators/$validator"
        local config_file="$validator_home/config/config.toml"
        local app_file="$validator_home/config/app.toml"
        
        log_info "Configuring $validator..."
        
        # Set validator-specific ports to avoid conflicts
        local p2p_port=$((26656 + $i))
        local rpc_port=$((26657 + $i))
        local api_port=$((1317 + $i))
        local grpc_port=$((9090 + $i))
        local grpc_web_port=$((9091 + $i))
        
        # Update config.toml
        sed -i.bak "s/laddr = \"tcp:\/\/127.0.0.1:26657\"/laddr = \"tcp:\/\/127.0.0.1:$rpc_port\"/" "$config_file"
        sed -i.bak "s/laddr = \"tcp:\/\/0.0.0.0:26656\"/laddr = \"tcp:\/\/0.0.0.0:$p2p_port\"/" "$config_file"
        
        # Update app.toml
        sed -i.bak "s/address = \"tcp:\/\/localhost:1317\"/address = \"tcp:\/\/localhost:$api_port\"/" "$app_file"
        sed -i.bak "s/address = \"localhost:9090\"/address = \"localhost:$grpc_port\"/" "$app_file"
        sed -i.bak "s/address = \"localhost:9091\"/address = \"localhost:$grpc_web_port\"/" "$app_file"
        
        # Enable API
        sed -i.bak 's/enable = false/enable = true/' "$app_file"
        sed -i.bak 's/swagger = false/swagger = true/' "$app_file"
        
        log_success "$validator configured (RPC:$rpc_port, API:$api_port, gRPC:$grpc_port)"
    done
}

# Step 5: Start validators
start_validators() {
    log_info "Starting validators..."
    
    for validator in "${VALIDATORS[@]}"; do
        log_info "Starting $validator..."
        
        # Start validator in background
        nohup ./personachaind start --home "./validators/$validator" > "./validators/$validator/validator.log" 2>&1 &
        echo $! > "./validators/$validator/validator.pid"
        
        sleep 2
        
        if kill -0 $(cat "./validators/$validator/validator.pid") 2>/dev/null; then
            log_success "$validator started successfully (PID: $(cat "./validators/$validator/validator.pid"))"
        else
            log_error "Failed to start $validator"
        fi
    done
}

# Step 6: Validate deployment
validate_deployment() {
    log_info "Validating deployment..."
    
    sleep 10
    
    for i in "${!VALIDATORS[@]}"; do
        local validator="${VALIDATORS[$i]}"
        local rpc_port=$((26657 + $i))
        local api_port=$((1317 + $i))
        
        log_info "Checking $validator..."
        
        # Check if RPC is responding
        if curl -s "http://localhost:$rpc_port/status" > /dev/null; then
            log_success "$validator RPC responding on port $rpc_port"
        else
            log_warning "$validator RPC not responding on port $rpc_port"
        fi
        
        # Check if API is responding
        if curl -s "http://localhost:$api_port/cosmos/base/tendermint/v1beta1/node_info" > /dev/null; then
            log_success "$validator API responding on port $api_port"
        else
            log_warning "$validator API not responding on port $api_port"
        fi
    done
}

# Main deployment process
main() {
    echo ""
    log_info "Starting PersonaChain validator deployment..."
    echo ""
    
    # Clean previous deployment
    rm -rf ./validators
    mkdir -p ./validators
    
    # Initialize all validators
    for i in "${!VALIDATORS[@]}"; do
        init_validator "${VALIDATORS[$i]}" "$i"
    done
    
    # Create and distribute genesis
    create_genesis
    distribute_genesis
    
    # Configure validators
    configure_validators
    
    # Start validators
    start_validators
    
    # Validate deployment
    validate_deployment
    
    echo ""
    log_success "PersonaChain deployment complete!"
    echo ""
    echo "📊 Validator Status:"
    echo "===================="
    for i in "${!VALIDATORS[@]}"; do
        local validator="${VALIDATORS[$i]}"
        local rpc_port=$((26657 + $i))
        local api_port=$((1317 + $i))
        echo "🔹 $validator:"
        echo "   RPC: http://localhost:$rpc_port"
        echo "   API: http://localhost:$api_port"
        echo "   Home: ./validators/$validator"
        echo ""
    done
    
    echo "🔧 Management Commands:"
    echo "======================="
    echo "• Check validator status: curl http://localhost:26657/status"
    echo "• Stop all validators: ./stop-validators.sh"
    echo "• View logs: tail -f ./validators/[validator-name]/validator.log"
    echo ""
}

# Run main function
main "$@"