#!/bin/bash
# PersonaPass Sentry Node Setup Script
# Automated setup for sentry nodes on personapass.xyz

set -e

# Variables
SENTRY_INDEX=${sentry_index}
DOMAIN=${domain}
ENVIRONMENT=${environment}
CHAIN_ID="personachain-1"
MONIKER="PersonaPass-Sentry-${SENTRY_INDEX}"

echo "🛡️ Setting up PersonaPass Sentry Node ${SENTRY_INDEX} for ${DOMAIN}"

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

# Configure sentry node
cat > /opt/personachain/data/config/config.toml << EOF
# PersonaPass Sentry Node Configuration
proxy_app = "tcp://127.0.0.1:26658"
moniker = "$MONIKER"

# RPC Server Configuration
[rpc]
laddr = "tcp://0.0.0.0:26657"
cors_allowed_origins = ["*"]
cors_allowed_methods = ["HEAD", "GET", "POST"]
cors_allowed_headers = ["Origin", "Accept", "Content-Type", "X-Requested-With", "X-Server-Time"]
max_open_connections = 900

# P2P Configuration (Sentry-specific)
[p2p]
laddr = "tcp://0.0.0.0:26656"
external_address = "$(curl -4 icanhazip.com):26656"
max_num_inbound_peers = 100
max_num_outbound_peers = 50
flush_throttle_timeout = "100ms"

# Sentry node settings
pex = true
seed_mode = false
private_peer_ids = ""

# Seeds for initial peer discovery
seeds = "seed-1.personapass.xyz:26656,seed-2.personapass.xyz:26656"

# Unconditional peer IDs (validators protected by this sentry)
unconditional_peer_ids = ""

# Mempool
[mempool]
size = 10000
max_txs_bytes = 2147483648
cache_size = 20000

# Consensus
[consensus]
timeout_commit = "5s"
peer_gossip_sleep_duration = "100ms"
peer_query_maj23_sleep_duration = "2s"

# State Sync Configuration
[statesync]
enable = true
rpc_servers = "rpc.${DOMAIN}:80,rpc2.${DOMAIN}:80"
trust_height = 0
trust_hash = ""
trust_period = "168h0m0s"

# Instrumentation
[instrumentation]
prometheus = true
prometheus_listen_addr = ":26660"
max_open_connections = 3
namespace = "tendermint"
EOF

# Configure app.toml for sentry
cat > /opt/personachain/data/config/app.toml << EOF
# PersonaPass Sentry Application Configuration
minimum-gas-prices = "0.001upersona"

# API Configuration
[api]
enable = true
swagger = true
address = "tcp://0.0.0.0:1317"
max-open-connections = 1000
rpc-read-timeout = 10
rpc-write-timeout = 0
rpc-max-body-bytes = 1000000
enabled-unsafe-cors = true

# GRPC Configuration
[grpc]
enable = true
address = "0.0.0.0:9090"

# JSON-RPC Configuration
[json-rpc]
enable = true
address = "0.0.0.0:8545"

# State Sync Snapshots
[state-sync]
snapshot-interval = 1000
snapshot-keep-recent = 5
EOF

# Create systemd service for sentry
cat > /etc/systemd/system/personachain-sentry.service << EOF
[Unit]
Description=PersonaPass Sentry Node
After=network-online.target

[Service]
User=ec2-user
ExecStart=/opt/personachain/personachaind start --home /opt/personachain/data
Restart=always
RestartSec=3
LimitNOFILE=65536
Environment=DAEMON_HOME=/opt/personachain/data
Environment=DAEMON_NAME=personachaind
Environment=DAEMON_ALLOW_DOWNLOAD_BINARIES=false
Environment=DAEMON_RESTART_AFTER_UPGRADE=true

[Install]
WantedBy=multi-user.target
EOF

# Set up log rotation
cat > /etc/logrotate.d/personachain-sentry << EOF
/opt/personachain/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    create 0644 ec2-user ec2-user
    postrotate
        systemctl reload personachain-sentry
    endscript
}
EOF

# Create Prometheus configuration for sentry
cat > /opt/monitoring/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'personachain-sentry'
    static_configs:
      - targets: ['localhost:26660']
    scrape_interval: 10s
    metrics_path: /metrics

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  # Scrape metrics from other sentry nodes
  - job_name: 'sentry-network'
    static_configs:
      - targets: 
        - 'sentry-1.${DOMAIN}:26660'
        - 'sentry-2.${DOMAIN}:26660'
        - 'sentry-3.${DOMAIN}:26660'
        - 'sentry-4.${DOMAIN}:26660'
        - 'sentry-5.${DOMAIN}:26660'
    scrape_interval: 30s
EOF

# Set up Node Exporter
docker run -d --name node-exporter \
  --restart=unless-stopped \
  -p 9100:9100 \
  -v "/proc:/host/proc:ro" \
  -v "/sys:/host/sys:ro" \
  -v "/:/rootfs:ro" \
  prom/node-exporter \
  --path.procfs=/host/proc \
  --path.rootfs=/rootfs \
  --path.sysfs=/host/sys \
  --collector.filesystem.mount-points-exclude="^/(sys|proc|dev|host|etc)($$|/)"

# Set up Prometheus
docker run -d --name prometheus \
  --restart=unless-stopped \
  -p 9090:9090 \
  -v /opt/monitoring/prometheus:/etc/prometheus \
  prom/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/prometheus \
  --web.console.libraries=/etc/prometheus/console_libraries \
  --web.console.templates=/etc/prometheus/consoles \
  --web.enable-lifecycle

# Set up Grafana for monitoring
docker run -d --name grafana \
  --restart=unless-stopped \
  -p 3000:3000 \
  -v /opt/monitoring/grafana:/var/lib/grafana \
  -e GF_SECURITY_ADMIN_PASSWORD=PersonaPass2024! \
  grafana/grafana

# Set file permissions
chown -R ec2-user:ec2-user /opt/personachain
chown -R ec2-user:ec2-user /opt/monitoring

# Create sentry-specific scripts
cat > /opt/personachain/sync-check.sh << 'EOF'
#!/bin/bash
# Check sync status of sentry node

STATUS=$(curl -s http://localhost:26657/status)
CATCHING_UP=$(echo $STATUS | jq -r .result.sync_info.catching_up)
LATEST_BLOCK=$(echo $STATUS | jq -r .result.sync_info.latest_block_height)
LATEST_TIME=$(echo $STATUS | jq -r .result.sync_info.latest_block_time)

if [ "$CATCHING_UP" = "false" ]; then
    echo "✅ Sentry node is synced"
    echo "📊 Latest block: $LATEST_BLOCK"
    echo "⏰ Latest time: $LATEST_TIME"
    exit 0
else
    echo "⏳ Sentry node is catching up..."
    echo "📊 Current block: $LATEST_BLOCK"
    exit 1
fi
EOF

chmod +x /opt/personachain/sync-check.sh

# Create peer management script
cat > /opt/personachain/peer-management.sh << 'EOF'
#!/bin/bash
# Manage peers for sentry node

NET_INFO=$(curl -s http://localhost:26657/net_info)
PEER_COUNT=$(echo $NET_INFO | jq -r .result.n_peers)
PEERS=$(echo $NET_INFO | jq -r '.result.peers[].node_info.id')

echo "🌐 Current peer count: $PEER_COUNT"
echo "👥 Connected peers:"
echo "$PEERS"

# Alert if peer count is too low
if [ "$PEER_COUNT" -lt 5 ]; then
    echo "⚠️ WARNING: Low peer count ($PEER_COUNT)"
    # Send alert (configure notification service)
fi
EOF

chmod +x /opt/personachain/peer-management.sh

# Create health check for sentry
cat > /opt/personachain/health-check.sh << 'EOF'
#!/bin/bash
# Health check for sentry node

# Check if node is running
if ! pgrep -f "personachaind" > /dev/null; then
    echo "ERROR: PersonaChain daemon not running"
    exit 1
fi

# Check RPC endpoint
if ! curl -s http://localhost:26657/health > /dev/null; then
    echo "ERROR: RPC endpoint not responding"
    exit 1
fi

# Check peer connectivity
PEER_COUNT=$(curl -s http://localhost:26657/net_info | jq -r .result.n_peers)
if [ "$PEER_COUNT" -lt 3 ]; then
    echo "WARNING: Low peer count ($PEER_COUNT)"
fi

# Check sync status
CATCHING_UP=$(curl -s http://localhost:26657/status | jq -r .result.sync_info.catching_up)
LATEST_BLOCK=$(curl -s http://localhost:26657/status | jq -r .result.sync_info.latest_block_height)

echo "OK: Sentry healthy"
echo "📊 Block height: $LATEST_BLOCK"
echo "🔄 Catching up: $CATCHING_UP"
echo "👥 Peers: $PEER_COUNT"
exit 0
EOF

chmod +x /opt/personachain/health-check.sh

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Configure CloudWatch agent for sentry
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "metrics": {
        "namespace": "PersonaPass/Sentry",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait"
                ],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            },
            "net": {
                "measurement": [
                    "bytes_sent",
                    "bytes_recv",
                    "packets_sent",
                    "packets_recv"
                ],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            }
        }
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/opt/personachain/logs/sentry.log",
                        "log_group_name": "PersonaPass/Sentry/${SENTRY_INDEX}",
                        "log_stream_name": "{instance_id}"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent

# Set up automated tasks
cat > /opt/personachain/daily-tasks.sh << 'EOF'
#!/bin/bash
# Daily maintenance tasks for sentry node

echo "🔄 Running daily sentry maintenance..."

# Check disk space
DISK_USAGE=$(df /opt/personachain | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "⚠️ Disk usage high: ${DISK_USAGE}%"
fi

# Rotate logs manually if needed
find /opt/personachain/logs -name "*.log" -size +1G -exec logrotate /etc/logrotate.d/personachain-sentry {} \;

# Update peer list if needed
/opt/personachain/peer-management.sh

# Compact database if needed (weekly)
if [ "$(date +%u)" -eq 1 ]; then
    echo "🗜️ Compacting database..."
    systemctl stop personachain-sentry
    /opt/personachain/personachaind compact /opt/personachain/data/data
    systemctl start personachain-sentry
fi

echo "✅ Daily maintenance complete"
EOF

chmod +x /opt/personachain/daily-tasks.sh

# Set up cron for maintenance (daily at 3 AM)
echo "0 3 * * * /opt/personachain/daily-tasks.sh" | crontab -u ec2-user -

# Enable and start services
systemctl daemon-reload
systemctl enable personachain-sentry
systemctl start personachain-sentry

# Wait for node to start
echo "⏳ Waiting for sentry node to start..."
sleep 30

# Check node status
echo "📊 Sentry node status:"
/opt/personachain/health-check.sh

echo "✅ PersonaPass Sentry Node ${SENTRY_INDEX} setup complete!"
echo "🔗 RPC Endpoint: http://$(curl -s http://checkip.amazonaws.com):26657"
echo "🔗 API Endpoint: http://$(curl -s http://checkip.amazonaws.com):1317"
echo "📊 Prometheus: http://$(curl -s http://checkip.amazonaws.com):9090"
echo "📈 Grafana: http://$(curl -s http://checkip.amazonaws.com):3000"

# Save sentry information
cat > /opt/personachain/sentry-info.txt << EOF
PersonaPass Sentry Node ${SENTRY_INDEX} Information
===============================================
Domain: ${DOMAIN}
Moniker: ${MONIKER}
Chain ID: ${CHAIN_ID}
Public IP: $(curl -s http://checkip.amazonaws.com)
RPC: http://$(curl -s http://checkip.amazonaws.com):26657
API: http://$(curl -s http://checkip.amazonaws.com):1317
Prometheus: http://$(curl -s http://checkip.amazonaws.com):9090
Grafana: http://$(curl -s http://checkip.amazonaws.com):3000

Node ID: $(curl -s http://localhost:26657/status | jq -r .result.node_info.id)

Setup Date: $(date)
EOF

echo "📝 Sentry information saved to /opt/personachain/sentry-info.txt"