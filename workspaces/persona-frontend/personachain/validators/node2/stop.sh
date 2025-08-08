#!/bin/bash
cd "$(dirname "$0")"
if [ -f validator.pid ]; then
    pid=$(cat validator.pid)
    if kill -0 $pid 2>/dev/null; then
        echo "🛑 Stopping Node 2 (PID: $pid)..."
        kill $pid
        rm validator.pid
    else
        echo "Node 2 not running"
    fi
else
    echo "Node 2 PID file not found"
fi
