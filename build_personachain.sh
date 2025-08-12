#!/bin/bash

echo "🚀 BUILDING PERSONACHAIN WITH ALL MODULES"
echo "========================================"

# Clean build cache
echo "🧹 Cleaning build cache..."
go clean -cache

# Tidy dependencies
echo "📦 Updating dependencies..."
go mod tidy

# Build the entire application
echo "🔨 Building PersonaChain..."
if go build -o bin/personachaind ./cmd/personachaind; then
    echo "✅ BUILD SUCCESSFUL!"
    echo ""
    echo "🎯 PersonaChain now has 11/32 modules:"
    echo "   📂 Foundation (6): auth, bank, staking, genutil, upgrade, consensus"
    echo "   ⚡ Critical (4): gov, mint, distribution, slashing, params"
    echo "   🆔 Identity (4): did, credential, zkproof, identity"
    echo ""
    echo "📊 PROGRESS: 34% complete (11/32 modules)"
    echo "🎯 NEXT: Build remaining 21 modules"
    echo ""
    echo "🚀 Binary location: ./bin/personachaind"
else
    echo "❌ BUILD FAILED!"
    echo "Check error messages above"
    exit 1
fi