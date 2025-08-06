#!/bin/bash

# 🚀 PersonaChain & ID Token Deployment Script

echo "🌟 Starting PersonaChain & ID Token Deployment..."

# =============================================================================
# STEP 1: PERSONACHAIN SETUP
# =============================================================================

echo "📦 Step 1: Setting up PersonaChain node..."

# Download PersonaChain binary (replace with your actual binary)
wget -O personachaind https://github.com/PersonaPass-ID/personachain/releases/latest/download/personachaind
chmod +x personachaind
sudo mv personachaind /usr/local/bin/

# Initialize chain
personachaind init "PersonaChain Validator" --chain-id personachain-1 --home ~/.personachain

# Configure genesis
cat > ~/.personachain/config/genesis.json << 'EOF'
{
  "genesis_time": "2025-01-01T00:00:00Z",
  "chain_id": "personachain-1",
  "initial_height": "1",
  "consensus_params": {
    "block": {
      "max_bytes": "22020096",
      "max_gas": "100000000",
      "time_iota_ms": "1000"
    },
    "evidence": {
      "max_age_num_blocks": "100000",
      "max_age_duration": "172800000000000"
    },
    "validator": {
      "pub_key_types": ["ed25519"]
    }
  },
  "app_hash": "",
  "app_state": {
    "auth": {
      "params": {
        "max_memo_characters": "256",
        "tx_sig_limit": "7",
        "tx_size_cost_per_byte": "10",
        "sig_verify_cost_ed25519": "590",
        "sig_verify_cost_secp256k1": "1000"
      },
      "accounts": []
    },
    "bank": {
      "params": {
        "send_enabled": [],
        "default_send_enabled": true
      },
      "balances": [],
      "supply": []
    }
  }
}
EOF

echo "✅ PersonaChain node initialized"

# =============================================================================
# STEP 2: ID TOKEN CONTRACT DEPLOYMENT
# =============================================================================

echo "🪙 Step 2: Preparing ID Token deployment..."

# Create ID token contract
cat > id_token_contract.json << 'EOF'
{
  "name": "PersonaID Token",
  "symbol": "ID",
  "decimals": 6,
  "initial_balances": [
    {
      "address": "persona1admin...", // Replace with your admin address
      "amount": "1000000000000000"   // 1B ID tokens (with 6 decimals)
    }
  ],
  "mint": {
    "minter": "persona1admin...",     // Replace with your admin address
    "cap": "10000000000000000"       // 10B max supply
  },
  "marketing": {
    "project": "PersonaPass Identity Platform",
    "description": "Native token for PersonaChain identity operations",
    "marketing": "persona1admin...",  // Replace with marketing address
    "logo": {
      "url": "https://personapass.xyz/logo.png"
    }
  }
}
EOF

echo "📄 ID Token contract configuration created"

# =============================================================================
# STEP 3: WALLET INTEGRATION SETUP
# =============================================================================

echo "💳 Step 3: Setting up wallet integration..."

# Create wallet configuration for Keplr
cat > keplr_chain_config.json << 'EOF'
{
  "chainId": "personachain-1",
  "chainName": "PersonaChain Identity Network", 
  "rpc": "https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com",
  "rest": "https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com",
  "bip44": {
    "coinType": 118
  },
  "bech32Config": {
    "bech32PrefixAccAddr": "persona",
    "bech32PrefixAccPub": "personapub", 
    "bech32PrefixValAddr": "personavaloper",
    "bech32PrefixValPub": "personavaloperpub",
    "bech32PrefixConsAddr": "personavalcons",
    "bech32PrefixConsPub": "personavalconspub"
  },
  "currencies": [{
    "coinDenom": "ID",
    "coinMinimalDenom": "uid",
    "coinDecimals": 6,
    "coinGeckoId": "personaid"
  }],
  "feeCurrencies": [{
    "coinDenom": "ID", 
    "coinMinimalDenom": "uid",
    "coinDecimals": 6,
    "gasPriceStep": {
      "low": 0.001,
      "average": 0.002, 
      "high": 0.005
    }
  }],
  "stakeCurrency": {
    "coinDenom": "ID",
    "coinMinimalDenom": "uid", 
    "coinDecimals": 6
  },
  "features": ["ibc-transfer", "cosmwasm"]
}
EOF

echo "✅ Wallet configuration created"

# =============================================================================
# STEP 4: DEPLOYMENT COMMANDS
# =============================================================================

echo "🚀 Step 4: Deployment ready!"
echo ""
echo "Next steps to complete deployment:"
echo "1. 📦 Deploy PersonaChain validator node"
echo "2. 🪙 Deploy ID token smart contract" 
echo "3. 💳 Add chain to Keplr/Leap wallets"
echo "4. 🌐 Update frontend configuration"
echo "5. ✅ Test wallet connections"
echo ""

# =============================================================================
# DEPLOYMENT COMMANDS TO RUN
# =============================================================================

cat << 'EOF'

# DEPLOYMENT COMMANDS (run these after setting up your validator):

# 1. Store token contract on PersonaChain
personachaind tx wasm store token_contract.wasm \
  --from validator \
  --gas 2000000 \
  --fees 50000uid \
  --chain-id personachain-1 \
  --node https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com

# 2. Instantiate ID token contract  
personachaind tx wasm instantiate $CODE_ID \
  "$(cat id_token_contract.json)" \
  --from validator \
  --label "PersonaID Token v1.0" \
  --admin persona1admin... \
  --chain-id personachain-1 \
  --gas 1000000 \
  --fees 25000uid

# 3. Add chain to Keplr programmatically
window.keplr.experimentalSuggestChain(keplr_chain_config)

# 4. Test wallet connection
personachaind query bank balances persona1...

EOF

echo "🎉 PersonaChain deployment script complete!"
echo "📋 Configuration files created:"
echo "  - id_token_contract.json (Token contract)"
echo "  - keplr_chain_config.json (Wallet integration)"
echo ""
echo "🚀 Ready to deploy your PersonaChain with native ID token!"