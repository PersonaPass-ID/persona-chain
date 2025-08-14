#!/bin/bash
set -euo pipefail

# PersonaChain 3-Node Network Expansion Script
# Expands working single-node to full 3-node validator network

echo "🌐 PersonaChain 3-Node Network Expansion"
echo "======================================="

# Configuration
BUILD_DIR="/home/rocz/persona-hq/build"
BINARY_NAME="personachaind"

# Node IPs  
RPC_IP="98.81.101.12"
SENTRY_IP="44.223.88.2"
VALIDATOR_IP="10.10.2.241"

echo "📋 Prerequisites check..."
if ! curl -s http://$RPC_IP:26657/status > /dev/null; then
    echo "❌ RPC node not responding. Run fix-and-build.sh first!"
    exit 1
fi

BLOCK_HEIGHT=$(curl -s http://$RPC_IP:26657/status | jq -r '.result.sync_info.latest_block_height')
echo "✅ RPC node is working. Current height: $BLOCK_HEIGHT"

echo "📤 Step 1: Copying binary to sentry and validator nodes..."

# Copy binary to sentry
scp -i ~/.ssh/PersonaChainAccess-debug.pem "$BUILD_DIR/$BINARY_NAME" ubuntu@$SENTRY_IP:/tmp/
ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$SENTRY_IP << 'SENTRY_INSTALL'
sudo pkill -f personachaind || true
sudo -u personachain mv /tmp/personachaind /home/personachain/bin/personachaind
sudo chmod +x /home/personachain/bin/personachaind
sudo -u personachain mkdir -p /home/personachain/cosmovisor/genesis/bin
sudo -u personachain cp /home/personachain/bin/personachaind /home/personachain/cosmovisor/genesis/bin/
echo "✅ Sentry binary installed"
SENTRY_INSTALL

# Copy binary to validator via sentry proxy
scp -i ~/.ssh/PersonaChainAccess-debug.pem -o ProxyCommand="ssh -i ~/.ssh/PersonaChainAccess-debug.pem -W %h:%p ubuntu@$SENTRY_IP" "$BUILD_DIR/$BINARY_NAME" ubuntu@$VALIDATOR_IP:/tmp/
ssh -i ~/.ssh/PersonaChainAccess-debug.pem -o ProxyCommand="ssh -i ~/.ssh/PersonaChainAccess-debug.pem -W %h:%p ubuntu@$SENTRY_IP" ubuntu@$VALIDATOR_IP << 'VALIDATOR_INSTALL'
sudo pkill -f personachaind || true
sudo -u personachain mv /tmp/personachaind /home/personachain/bin/personachaind
sudo chmod +x /home/personachain/bin/personachaind
sudo -u personachain mkdir -p /home/personachain/cosmovisor/genesis/bin
sudo -u personachain cp /home/personachain/bin/personachaind /home/personachain/cosmovisor/genesis/bin/
echo "✅ Validator binary installed"
VALIDATOR_INSTALL

echo "📄 Step 2: Copying genesis.json to all nodes..."

# Get genesis from RPC
ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$RPC_IP "sudo cp /home/personachain/.personachain/config/genesis.json /tmp/genesis.json && sudo chown ubuntu:ubuntu /tmp/genesis.json"
scp -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$RPC_IP:/tmp/genesis.json /tmp/genesis-working.json

# Copy to sentry
scp -i ~/.ssh/PersonaChainAccess-debug.pem /tmp/genesis-working.json ubuntu@$SENTRY_IP:/tmp/genesis.json
ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$SENTRY_IP "sudo -u personachain rm -rf /home/personachain/.personachain && sudo -u personachain mkdir -p /home/personachain/.personachain/config && sudo cp /tmp/genesis.json /home/personachain/.personachain/config/genesis.json && sudo chown personachain:personachain /home/personachain/.personachain/config/genesis.json"

# Copy to validator  
scp -i ~/.ssh/PersonaChainAccess-debug.pem -o ProxyCommand="ssh -i ~/.ssh/PersonaChainAccess-debug.pem -W %h:%p ubuntu@$SENTRY_IP" /tmp/genesis-working.json ubuntu@$VALIDATOR_IP:/tmp/genesis.json
ssh -i ~/.ssh/PersonaChainAccess-debug.pem -o ProxyCommand="ssh -i ~/.ssh/PersonaChainAccess-debug.pem -W %h:%p ubuntu@$SENTRY_IP" ubuntu@$VALIDATOR_IP "sudo -u personachain rm -rf /home/personachain/.personachain && sudo -u personachain mkdir -p /home/personachain/.personachain/config && sudo cp /tmp/genesis.json /home/personachain/.personachain/config/genesis.json && sudo chown personachain:personachain /home/personachain/.personachain/config/genesis.json"

echo "🔗 Step 3: Getting node IDs for peer configuration..."

# Get node IDs
RPC_NODE_ID=$(ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$RPC_IP "sudo -u personachain /home/personachain/bin/personachaind comet show-node-id --home /home/personachain/.personachain")
echo "RPC Node ID: $RPC_NODE_ID"

# Initialize other nodes to get their node IDs
SENTRY_NODE_ID=$(ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$SENTRY_IP "sudo -u personachain /home/personachain/bin/personachaind init sentry-1 --chain-id persona-1 --home /home/personachain/.personachain --overwrite > /dev/null && sudo -u personachain /home/personachain/bin/personachaind comet show-node-id --home /home/personachain/.personachain")
echo "Sentry Node ID: $SENTRY_NODE_ID"

VALIDATOR_NODE_ID=$(ssh -i ~/.ssh/PersonaChainAccess-debug.pem -o ProxyCommand="ssh -i ~/.ssh/PersonaChainAccess-debug.pem -W %h:%p ubuntu@$SENTRY_IP" ubuntu@$VALIDATOR_IP "sudo -u personachain /home/personachain/bin/personachaind init validator-1 --chain-id persona-1 --home /home/personachain/.personachain --overwrite > /dev/null && sudo -u personachain /home/personachain/bin/personachaind comet show-node-id --home /home/personachain/.personachain")
echo "Validator Node ID: $VALIDATOR_NODE_ID"

echo "⚙️ Step 4: Configuring peer connections..."

# Configure RPC node (connects to sentry)
ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$RPC_IP << EOF
sudo -u personachain bash -c "
sed -i 's/persistent_peers = .*/persistent_peers = \"$SENTRY_NODE_ID@$SENTRY_IP:26656\"/' /home/personachain/.personachain/config/config.toml
sed -i 's/pex = true/pex = true/' /home/personachain/.personachain/config/config.toml
"
EOF

# Configure Sentry node (connects to validator and RPC)  
ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$SENTRY_IP << EOF
sudo -u personachain bash -c "
sed -i 's/persistent_peers = .*/persistent_peers = \"$VALIDATOR_NODE_ID@$VALIDATOR_IP:26656,$RPC_NODE_ID@$RPC_IP:26656\"/' /home/personachain/.personachain/config/config.toml
sed -i 's/pex = true/pex = true/' /home/personachain/.personachain/config/config.toml
sed -i 's/external_address = .*/external_address = \"$SENTRY_IP:26656\"/' /home/personachain/.personachain/config/config.toml
"
EOF

# Configure Validator node (connects only to sentry)
ssh -i ~/.ssh/PersonaChainAccess-debug.pem -o ProxyCommand="ssh -i ~/.ssh/PersonaChainAccess-debug.pem -W %h:%p ubuntu@$SENTRY_IP" ubuntu@$VALIDATOR_IP << EOF
sudo -u personachain bash -c "
sed -i 's/persistent_peers = .*/persistent_peers = \"$SENTRY_NODE_ID@$SENTRY_IP:26656\"/' /home/personachain/.personachain/config/config.toml
sed -i 's/pex = false/pex = false/' /home/personachain/.personachain/config/config.toml
sed -i 's/private_peer_ids = .*/private_peer_ids = \"\"/' /home/personachain/.personachain/config/config.toml
"
EOF

echo "🔄 Step 5: Restarting all nodes..."

# Stop RPC node  
ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$RPC_IP "sudo pkill -f personachaind || true"

# Start validator first
ssh -i ~/.ssh/PersonaChainAccess-debug.pem -o ProxyCommand="ssh -i ~/.ssh/PersonaChainAccess-debug.pem -W %h:%p ubuntu@$SENTRY_IP" ubuntu@$VALIDATOR_IP << 'VALIDATOR_START'
sudo -u personachain bash -c "
nohup /home/personachain/bin/personachaind start --home /home/personachain/.personachain > /tmp/validator.log 2>&1 &
"
echo "✅ Validator started"
VALIDATOR_START

sleep 5

# Start sentry
ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$SENTRY_IP << 'SENTRY_START'
sudo -u personachain bash -c "
nohup /home/personachain/bin/personachaind start --home /home/personachain/.personachain > /tmp/sentry.log 2>&1 &
"
echo "✅ Sentry started"
SENTRY_START

sleep 5

# Start RPC
ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$RPC_IP << 'RPC_START'
sudo -u personachain bash -c "
nohup /home/personachain/bin/personachaind start --home /home/personachain/.personachain > /tmp/rpc.log 2>&1 &
"
echo "✅ RPC restarted"
RPC_START

echo "⏳ Step 6: Waiting for network synchronization..."
sleep 15

echo "📊 Step 7: Checking network status..."

echo ""
echo "🔍 RPC Node Status:"
if curl -s http://$RPC_IP:26657/status > /dev/null 2>&1; then
    RPC_HEIGHT=$(curl -s http://$RPC_IP:26657/status | jq -r '.result.sync_info.latest_block_height')
    RPC_PEERS=$(curl -s http://$RPC_IP:26657/net_info | jq -r '.result.n_peers')
    echo "  ✅ Height: $RPC_HEIGHT, Peers: $RPC_PEERS"
else
    echo "  ❌ RPC not responding"
fi

echo ""
echo "📋 Node Logs (last 10 lines each):"
echo "--- Validator ---"
ssh -i ~/.ssh/PersonaChainAccess-debug.pem -o ProxyCommand="ssh -i ~/.ssh/PersonaChainAccess-debug.pem -W %h:%p ubuntu@$SENTRY_IP" ubuntu@$VALIDATOR_IP "tail -10 /tmp/validator.log" | sed 's/^/  /'

echo "--- Sentry ---"  
ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$SENTRY_IP "tail -10 /tmp/sentry.log" | sed 's/^/  /'

echo "--- RPC ---"
ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$RPC_IP "tail -10 /tmp/rpc.log" | sed 's/^/  /'

echo ""
echo "🌐 Network Endpoints:"
echo "  RPC: http://$RPC_IP:26657"
echo "  API: http://$RPC_IP:1317" 
echo "  Status: curl http://$RPC_IP:26657/status"
echo "  Peers: curl http://$RPC_IP:26657/net_info"

echo ""
echo "🎉 3-Node PersonaChain Network Expansion Complete!"
echo ""
echo "🔧 Troubleshooting commands:"
echo "  Check validator: ssh -i ~/.ssh/PersonaChainAccess-debug.pem -o ProxyCommand=\"ssh -i ~/.ssh/PersonaChainAccess-debug.pem -W %h:%p ubuntu@$SENTRY_IP\" ubuntu@$VALIDATOR_IP 'tail -50 /tmp/validator.log'"
echo "  Check sentry: ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$SENTRY_IP 'tail -50 /tmp/sentry.log'" 
echo "  Check RPC: ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$RPC_IP 'tail -50 /tmp/rpc.log'"
EOF