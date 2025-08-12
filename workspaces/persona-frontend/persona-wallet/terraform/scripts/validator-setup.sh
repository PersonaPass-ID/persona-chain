#!/bin/bash
# PersonaPass Validator Node Setup Script
# Automated setup for validator nodes on personapass.xyz

set -e

# Variables
VALIDATOR_INDEX=${validator_index}
DOMAIN=${domain}
ENVIRONMENT=${environment}
CHAIN_ID="personachain-1"
MONIKER="PersonaPass-Validator-${VALIDATOR_INDEX}"

echo "🚀 Setting up PersonaPass Validator ${VALIDATOR_INDEX} for ${DOMAIN}"

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

# Initialize validator
echo "🔧 Initializing validator node..."
./personachaind init "$MONIKER" --chain-id "$CHAIN_ID" --home /opt/personachain/data

# Download genesis file
echo "📋 Downloading genesis file..."
curl -s https://raw.githubusercontent.com/persona-hq/personachain/main/networks/mainnet/genesis.json > /opt/personachain/data/config/genesis.json

# Configure validator
cat > /opt/personachain/data/config/config.toml << EOF
# PersonaPass Validator Configuration
proxy_app = "tcp://127.0.0.1:26658"
moniker = "$MONIKER"

# RPC Server
[rpc]
laddr = "tcp://0.0.0.0:26657"
cors_allowed_origins = ["*"]
cors_allowed_methods = ["HEAD", "GET", "POST"]
cors_allowed_headers = ["Origin", "Accept", "Content-Type", "X-Requested-With", "X-Server-Time"]

# P2P Configuration  
[p2p]
laddr = "tcp://0.0.0.0:26656"
external_address = "$(curl -4 icanhazip.com):26656"
max_num_inbound_peers = 40
max_num_outbound_peers = 10
flush_throttle_timeout = "100ms"

# Persistent peers (sentry nodes)
persistent_peers = "sentry-1.${DOMAIN}:26656,sentry-2.${DOMAIN}:26656,sentry-3.${DOMAIN}:26656"

# Private peer IDs (sentry nodes only)
private_peer_ids = ""

# Validator-specific settings
pex = false
seed_mode = false

# Mempool
[mempool]
size = 5000
max_txs_bytes = 1073741824

# Consensus
[consensus]
timeout_commit = "5s"
peer_gossip_sleep_duration = "100ms"
peer_query_maj23_sleep_duration = "2s"

# Instrumentation
[instrumentation]
prometheus = true
prometheus_listen_addr = ":26660"
max_open_connections = 3
namespace = "tendermint"
EOF

# Configure app.toml
cat > /opt/personachain/data/config/app.toml << EOF
# PersonaPass Application Configuration
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

# State Sync
[state-sync]
snapshot-interval = 2000
snapshot-keep-recent = 10
EOF

# Create systemd service
cat > /etc/systemd/system/personachain.service << EOF
[Unit]
Description=PersonaPass Validator Node
After=network-online.target

[Service]
User=ec2-user
ExecStart=/opt/personachain/personachaind start --home /opt/personachain/data
Restart=always
RestartSec=3
LimitNOFILE=4096
Environment=DAEMON_HOME=/opt/personachain/data
Environment=DAEMON_NAME=personachaind
Environment=DAEMON_ALLOW_DOWNLOAD_BINARIES=false
Environment=DAEMON_RESTART_AFTER_UPGRADE=true

[Install]
WantedBy=multi-user.target
EOF

# Set up log rotation
cat > /etc/logrotate.d/personachain << EOF
/opt/personachain/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    create 0644 ec2-user ec2-user
    postrotate
        systemctl reload personachain
    endscript
}
EOF

# Create Prometheus configuration
cat > /opt/monitoring/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'personachain-validator'
    static_configs:
      - targets: ['localhost:26660']
    scrape_interval: 10s
    metrics_path: /metrics

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
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

# Set file permissions
chown -R ec2-user:ec2-user /opt/personachain
chown -R ec2-user:ec2-user /opt/monitoring

# Generate validator key (if not exists)
if [ ! -f "/opt/personachain/data/config/priv_validator_key.json" ]; then
  echo "🔐 Generating validator key..."
  sudo -u ec2-user /opt/personachain/personachaind tendermint show-validator --home /opt/personachain/data > /opt/personachain/validator-pubkey.txt
fi

# Set up backup script
cat > /opt/personachain/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/personachain/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup validator key
cp /opt/personachain/data/config/priv_validator_key.json "$BACKUP_DIR/"
cp /opt/personachain/data/config/node_key.json "$BACKUP_DIR/"

# Backup to S3 (configure AWS credentials separately)
# aws s3 sync "$BACKUP_DIR" "s3://personapass-validator-backups/validator-${VALIDATOR_INDEX}/"

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x /opt/personachain/backup.sh

# Set up cron for backups (daily at 2 AM)
echo "0 2 * * * /opt/personachain/backup.sh" | crontab -u ec2-user -

# Create health check endpoint
cat > /opt/personachain/health-check.sh << 'EOF'
#!/bin/bash
# Health check for validator node

# Check if node is running
if ! pgrep -f "personachaind" > /dev/null; then
    echo "ERROR: PersonaChain daemon not running"
    exit 1
fi

# Check if node is synced
LATEST_BLOCK=$(curl -s http://localhost:26657/status | jq -r .result.sync_info.latest_block_height)
if [ "$LATEST_BLOCK" = "null" ] || [ "$LATEST_BLOCK" -eq 0 ]; then
    echo "ERROR: Node not synced or RPC not responding"
    exit 1
fi

echo "OK: Validator healthy, latest block: $LATEST_BLOCK"
exit 0
EOF

chmod +x /opt/personachain/health-check.sh

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "metrics": {
        "namespace": "PersonaPass/Validator",
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
            "diskio": {
                "measurement": [
                    "io_time"
                ],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/opt/personachain/logs/personachain.log",
                        "log_group_name": "PersonaPass/Validator/${VALIDATOR_INDEX}",
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

# Enable and start services
systemctl daemon-reload
systemctl enable personachain
systemctl start personachain

# Wait for node to start
echo "⏳ Waiting for node to start..."
sleep 30

# Check node status
echo "📊 Validator node status:"
/opt/personachain/health-check.sh

echo "✅ PersonaPass Validator ${VALIDATOR_INDEX} setup complete!"
echo "🔗 RPC Endpoint: http://$(curl -s http://checkip.amazonaws.com):26657"
echo "🔗 API Endpoint: http://$(curl -s http://checkip.amazonaws.com):1317"
echo "📊 Prometheus: http://$(curl -s http://checkip.amazonaws.com):9090"

# Save important information
cat > /opt/personachain/validator-info.txt << EOF
PersonaPass Validator ${VALIDATOR_INDEX} Information
=============================================
Domain: ${DOMAIN}
Moniker: ${MONIKER}
Chain ID: ${CHAIN_ID}
RPC: http://$(curl -s http://checkip.amazonaws.com):26657
API: http://$(curl -s http://checkip.amazonaws.com):1317
Prometheus: http://$(curl -s http://checkip.amazonaws.com):9090

Validator Public Key:
$(cat /opt/personachain/validator-pubkey.txt)

Setup Date: $(date)
EOF

echo "📝 Validator information saved to /opt/personachain/validator-info.txt"