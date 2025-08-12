#!/bin/bash
# PersonaPass Sentry Node Setup Script  
# Automated setup for sentry nodes on personapass.xyz

set -e

# Variables from Terraform
SENTRY_INDEX=${sentry_index}
DOMAIN=${domain}
ENVIRONMENT=${environment}
CHAIN_ID="personachain-1"
MONIKER="PersonaPass-Sentry-$SENTRY_INDEX"

echo "🛡️ Setting up PersonaPass Sentry Node $SENTRY_INDEX for $DOMAIN"

# Update system
yum update -y
yum install -y docker git wget curl jq

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Start Docker service
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Create directories
mkdir -p /opt/personachain/{config,data,logs}
mkdir -p /opt/monitoring/{prometheus,grafana}

# Download PersonaChain binary
echo "📥 Downloading PersonaChain binary..."
cd /opt/personachain
wget https://github.com/persona-hq/personachain/releases/latest/download/personachaind -O personachaind
chmod +x personachaind

# Initialize sentry node
echo "🔧 Initializing sentry node..."
./personachaind init "$MONIKER" --chain-id "$CHAIN_ID" --home /opt/personachain/data

# Download genesis file
echo "📋 Downloading genesis file..."
curl -s https://raw.githubusercontent.com/persona-hq/personachain/main/networks/mainnet/genesis.json > /opt/personachain/data/config/genesis.json

# Create basic config files
cat > /opt/personachain/data/config/config.toml << 'EOF'
# PersonaPass Sentry Node Configuration
proxy_app = "tcp://127.0.0.1:26658"

[rpc]
laddr = "tcp://0.0.0.0:26657"
cors_allowed_origins = ["*"]

[p2p]  
laddr = "tcp://0.0.0.0:26656"
max_num_inbound_peers = 100
max_num_outbound_peers = 50
pex = true

[instrumentation]
prometheus = true
prometheus_listen_addr = ":26660"
EOF

# Create systemd service
cat > /etc/systemd/system/personachain-sentry.service << 'EOF'
[Unit]
Description=PersonaPass Sentry Node
After=network-online.target

[Service]
User=ec2-user
ExecStart=/opt/personachain/personachaind start --home /opt/personachain/data
Restart=always
RestartSec=3
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

# Set permissions
chown -R ec2-user:ec2-user /opt/personachain

# Enable and start services
systemctl daemon-reload
systemctl enable personachain-sentry
systemctl start personachain-sentry

echo "✅ PersonaPass Sentry Node $SENTRY_INDEX setup complete!"
echo "🔗 RPC Endpoint: http://$(curl -s http://checkip.amazonaws.com):26657"