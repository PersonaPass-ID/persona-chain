#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 Starting PersonaChain Validator Node 1..."
../../personachaind start \
    --home . \
    --log_level info \
    > validator.log 2>&1 &
echo $! > validator.pid
echo "✅ Node 1 started (PID: $(cat validator.pid))"
