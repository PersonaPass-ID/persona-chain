#!/bin/bash

# PersonaChain Validator Initialization Script
# This script sets up a new validator node for PersonaChain

set -e

# Update system
apt-get update -y
apt-get install -y curl wget jq git build-essential

# Install Go 1.19
wget https://go.dev/dl/go1.19.linux-amd64.tar.gz
tar -xzf go1.19.linux-amd64.tar.gz -C /usr/local
echo 'export PATH=$PATH:/usr/local/go/bin' >> /home/ubuntu/.bashrc
echo 'export GOPATH=/home/ubuntu/go' >> /home/ubuntu/.bashrc
echo 'export GOBIN=$GOPATH/bin' >> /home/ubuntu/.bashrc
source /home/ubuntu/.bashrc

# Create personachain user
useradd -m -s /bin/bash personachain
mkdir -p /home/personachain/.personachain
chown -R personachain:personachain /home/personachain

# Download PersonaChain binary (you'll need to build this or provide binary)
# For now, create a placeholder - you'll need to replace with actual PersonaChain binary
cat > /usr/local/bin/personachaind << 'EOF'
#!/bin/bash
# Placeholder PersonaChain daemon
# Replace with actual PersonaChain binary
echo "PersonaChain daemon placeholder - replace with real binary"
sleep infinity
EOF

chmod +x /usr/local/bin/personachaind

# Initialize node
sudo -u personachain personachaind init "validator-$(date +%s)" --chain-id personachain-1

# Get genesis file from existing validator
curl -s http://98.86.107.175:26657/genesis | jq '.result.genesis' > /home/personachain/.personachain/config/genesis.json
chown personachain:personachain /home/personachain/.personachain/config/genesis.json

# Configure persistent peers
PERSISTENT_PEERS="personachain-validator-1@98.86.107.175:26656"
sed -i "s/persistent_peers = \"\"/persistent_peers = \"$PERSISTENT_PEERS\"/" /home/personachain/.personachain/config/config.toml

# Configure external address
EXTERNAL_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
sed -i "s/external_address = \"\"/external_address = \"$EXTERNAL_IP:26656\"/" /home/personachain/.personachain/config/config.toml

# Create systemd service
cat > /etc/systemd/system/personachain.service << EOF
[Unit]
Description=PersonaChain Node
After=network-online.target

[Service]
User=personachain
ExecStart=/usr/local/bin/personachaind start
Restart=on-failure
RestartSec=3
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl enable personachain
systemctl daemon-reload

# Log startup
echo "PersonaChain validator initialization complete at $(date)" >> /var/log/personachain-init.log
echo "Node ID: $(sudo -u personachain personachaind tendermint show-node-id)" >> /var/log/personachain-init.log
echo "External IP: $EXTERNAL_IP" >> /var/log/personachain-init.log

# Note: Service will not start successfully until PersonaChain binary is properly installed
echo "Validator node configured. Install PersonaChain binary to complete setup."