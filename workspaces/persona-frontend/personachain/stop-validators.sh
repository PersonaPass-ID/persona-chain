#!/bin/bash

echo "🛑 Stopping PersonaChain Validators..."

VALIDATORS=(
    "validator-01"
    "validator-02" 
    "validator-03"
    "validator-04"
)

for validator in "${VALIDATORS[@]}"; do
    if [ -f "./validators/$validator/validator.pid" ]; then
        pid=$(cat "./validators/$validator/validator.pid")
        if kill -0 $pid 2>/dev/null; then
            echo "🔹 Stopping $validator (PID: $pid)..."
            kill $pid
            rm "./validators/$validator/validator.pid"
        else
            echo "🔹 $validator not running"
        fi
    else
        echo "🔹 $validator PID file not found"
    fi
done

echo "✅ All validators stopped"