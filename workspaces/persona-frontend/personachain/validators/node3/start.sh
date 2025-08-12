#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 Starting PersonaChain Validator Node 3..."
../../personachaind start \
    --home . \
    --log_level info \
    > validator.log 2>&1 &
echo $! > validator.pid
echo "✅ Node 3 started (PID: $(cat validator.pid))"
