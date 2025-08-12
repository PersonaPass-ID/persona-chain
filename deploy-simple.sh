#!/bin/bash

echo "🚀 PersonaChain Simple Deployment for Development"
echo "==============================================="

# Create a simple test network using our working binary
echo "📦 Using existing PersonaChain binary..."

# Create validator directories
mkdir -p ./validators/node{1,2,3,4}

# Create simple configuration files for each validator
for i in {1..4}; do
    port_base=$((26650 + $i * 10))
    rpc_port=$((port_base + 7))
    p2p_port=$((port_base + 6))
    api_port=$((1310 + $i))
    grpc_port=$((9080 + $i))
    
    mkdir -p ./validators/node$i/config
    
    cat > ./validators/node$i/config/app.toml << EOF
# PersonaChain Node $i Configuration
minimum-gas-prices = "0persona"

[api]
enable = true
swagger = true
address = "tcp://localhost:$api_port"
max-open-connections = 1000
rpc-read-timeout = 10
rpc-write-timeout = 0
rpc-max-body-bytes = 1000000
enabled-unsafe-cors = true

[grpc]
enable = true
address = "localhost:$grpc_port"

[state-sync]
snapshot-interval = 0
snapshot-keep-recent = 2
EOF

    cat > ./validators/node$i/config/config.toml << EOF
# PersonaChain Node $i Configuration
proxy_app = "tcp://127.0.0.1:$((port_base + 8))"
moniker = "persona-validator-$i"
fast_sync = true
db_backend = "goleveldb"
db_dir = "data"
log_level = "info"
log_format = "plain"
genesis_file = "config/genesis.json"
priv_validator_key_file = "config/priv_validator_key.json"
priv_validator_state_file = "data/priv_validator_state.json"
priv_validator_laddr = ""
node_key_file = "config/node_key.json"
abci = "socket"
prof_laddr = ""
filter_peers = false

[rpc]
laddr = "tcp://127.0.0.1:$rpc_port"
cors_allowed_origins = ["*"]
cors_allowed_methods = ["HEAD", "GET", "POST"]
cors_allowed_headers = ["Origin", "Accept", "Content-Type", "X-Requested-With", "X-Server-Time"]
grpc_laddr = ""
grpc_max_open_connections = 900
unsafe = false
max_open_connections = 900
max_subscription_clients = 100
max_subscriptions_per_client = 5
timeout_broadcast_tx_commit = "10s"
max_body_bytes = 1000000
max_header_bytes = 1048576

[p2p]
laddr = "tcp://0.0.0.0:$p2p_port"
external_address = ""
seeds = ""
persistent_peers = ""
upnp = false
addr_book_file = "config/addrbook.json"
addr_book_strict = true
max_num_inbound_peers = 40
max_num_outbound_peers = 10
flush_throttle_timeout = "100ms"
max_packet_msg_payload_size = 1024
send_rate = 5120000
recv_rate = 5120000
pex = true
seed_mode = false
private_peer_ids = ""
allow_duplicate_ip = false
handshake_timeout = "20s"
dial_timeout = "3s"

[mempool]
recheck = true
broadcast = true
wal_dir = ""
size = 5000
max_txs_bytes = 1073741824
cache_size = 10000
max_tx_bytes = 1048576

[consensus]
wal_file = "data/cs.wal/wal"
timeout_propose = "3s"
timeout_propose_delta = "500ms"
timeout_prevote = "1s"
timeout_prevote_delta = "500ms"
timeout_precommit = "1s"
timeout_precommit_delta = "500ms"
timeout_commit = "5s"
skip_timeout_commit = false
create_empty_blocks = true
create_empty_blocks_interval = "0s"
peer_gossip_sleep_duration = "100ms"
peer_query_maj23_sleep_duration = "2s"

[storage]
discard_abci_responses = false

[tx_index]
indexer = "kv"

[instrumentation]
prometheus = false
prometheus_listen_addr = ":26660"
max_open_connections = 3
namespace = "tendermint"
EOF

    # Create simple genesis file
    cat > ./validators/node$i/config/genesis.json << EOF
{
  "genesis_time": "$(date -u +%Y-%m-%dT%H:%M:%S.000000000Z)",
  "chain_id": "personachain-1",
  "initial_height": "1",
  "consensus_params": {
    "block": {
      "max_bytes": "22020096",
      "max_gas": "-1",
      "time_iota_ms": "1000"
    },
    "evidence": {
      "max_age_num_blocks": "100000",
      "max_age_duration": "172800000000000",
      "max_bytes": "1048576"
    },
    "validator": {
      "pub_key_types": ["ed25519"]
    },
    "version": {}
  },
  "validators": [],
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
      "supply": [],
      "denom_metadata": []
    },
    "staking": {
      "params": {
        "unbonding_time": "1814400s",
        "max_validators": 100,
        "max_entries": 7,
        "historical_entries": 10000,
        "bond_denom": "persona"
      },
      "last_total_power": "0",
      "last_validator_powers": [],
      "validators": [],
      "delegations": [],
      "unbonding_delegations": [],
      "redelegations": [],
      "exported": false
    },
    "genutil": {
      "gen_txs": []
    },
    "upgrade": {},
    "consensus": {
      "params": {
        "block": {
          "max_bytes": "22020096",
          "max_gas": "-1"
        },
        "evidence": {
          "max_age_num_blocks": "100000",
          "max_age_duration": "172800000000000",
          "max_bytes": "1048576"
        },
        "validator": {
          "pub_key_types": ["ed25519"]
        },
        "version": {}
      }
    },
    "did": {
      "params": {},
      "did_documents": [],
      "did_document_count": "0"
    },
    "credential": {
      "params": {},
      "credentials": [],
      "credential_count": "0"
    },
    "zkproof": {
      "params": {},
      "circuits": [],
      "proofs": [],
      "proof_requests": [],
      "circuit_count": "0",
      "proof_count": "0",
      "proof_request_count": "0"
    }
  }
}
EOF

    # Create validator keys (simplified)
    mkdir -p ./validators/node$i/data
    cat > ./validators/node$i/config/priv_validator_key.json << EOF
{
  "address": "$(openssl rand -hex 20 | tr '[:lower:]' '[:upper:]')",
  "pub_key": {
    "type": "tendermint/PubKeyEd25519",
    "value": "$(openssl rand -base64 32)"
  },
  "priv_key": {
    "type": "tendermint/PrivKeyEd25519",
    "value": "$(openssl rand -base64 64)"
  }
}
EOF

    cat > ./validators/node$i/data/priv_validator_state.json << EOF
{
  "height": "0",
  "round": 0,
  "step": 0
}
EOF

    cat > ./validators/node$i/config/node_key.json << EOF
{
  "priv_key": {
    "type": "tendermint/PrivKeyEd25519",
    "value": "$(openssl rand -base64 64)"
  }
}
EOF

    echo "✅ Node $i configured (RPC: $rpc_port, API: $api_port, P2P: $p2p_port)"
done

# Create startup scripts for each node
for i in {1..4}; do
    cat > ./validators/node$i/start.sh << EOF
#!/bin/bash
cd "\$(dirname "\$0")"
echo "🚀 Starting PersonaChain Validator Node $i..."
../../personachaind start \\
    --home . \\
    --log_level info \\
    > validator.log 2>&1 &
echo \$! > validator.pid
echo "✅ Node $i started (PID: \$(cat validator.pid))"
EOF
    chmod +x ./validators/node$i/start.sh

    cat > ./validators/node$i/stop.sh << EOF
#!/bin/bash
cd "\$(dirname "\$0")"
if [ -f validator.pid ]; then
    pid=\$(cat validator.pid)
    if kill -0 \$pid 2>/dev/null; then
        echo "🛑 Stopping Node $i (PID: \$pid)..."
        kill \$pid
        rm validator.pid
    else
        echo "Node $i not running"
    fi
else
    echo "Node $i PID file not found"
fi
EOF
    chmod +x ./validators/node$i/stop.sh
done

# Start all validators
echo ""
echo "🚀 Starting all PersonaChain validators..."
for i in {1..4}; do
    ./validators/node$i/start.sh
    sleep 2
done

echo ""
echo "✅ PersonaChain Development Network Deployed!"
echo ""
echo "📊 Network Status:"
echo "=================="
for i in {1..4}; do
    rpc_port=$((26657 + ($i - 1) * 10))
    api_port=$((1310 + $i))
    echo "🔹 Node $i:"
    echo "   RPC: http://localhost:$rpc_port"
    echo "   API: http://localhost:$api_port"
    echo "   Home: ./validators/node$i"
    echo ""
done

echo "🔧 Management:"
echo "=============="
echo "• Stop all: for i in {1..4}; do ./validators/node\$i/stop.sh; done"
echo "• View logs: tail -f ./validators/node1/validator.log"
echo "• Test API: curl http://localhost:1311/persona/did/v1/dids"