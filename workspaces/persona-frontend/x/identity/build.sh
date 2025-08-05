#!/bin/bash

# Build script for PersonaChain Identity Module
# This script generates Go code from Protocol Buffer definitions

echo "🔨 Building PersonaChain Identity Module..."

# Check if protoc is installed
if ! command -v protoc &> /dev/null; then
    echo "❌ protoc is not installed. Please install Protocol Buffers compiler."
    echo "   Visit: https://grpc.io/docs/protoc-installation/"
    exit 1
fi

# Check if protoc-gen-gocosmos is installed
if ! command -v protoc-gen-gocosmos &> /dev/null; then
    echo "📦 Installing protoc-gen-gocosmos..."
    go install github.com/cosmos/gogoproto/protoc-gen-gocosmos@latest
fi

# Set module directory
MODULE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROTO_DIR="${MODULE_DIR}/types"
OUT_DIR="${MODULE_DIR}/types"

# Create output directory if it doesn't exist
mkdir -p "${OUT_DIR}"

echo "📄 Generating Go code from Protocol Buffers..."

# Generate Go code from proto files
protoc \
  --gocosmos_out=plugins=grpc,Mgoogle/protobuf/any.proto=github.com/cosmos/cosmos-sdk/codec/types:. \
  --proto_path="${PROTO_DIR}" \
  --proto_path="${GOPATH}/src" \
  --proto_path="${GOPATH}/src/github.com/cosmos/cosmos-sdk/proto" \
  --proto_path="${GOPATH}/src/github.com/cosmos/cosmos-sdk/third_party/proto" \
  "${PROTO_DIR}"/*.proto

if [ $? -eq 0 ]; then
    echo "✅ Proto files compiled successfully!"
else
    echo "❌ Failed to compile proto files"
    exit 1
fi

echo "🧪 Running tests..."
go test ./... -v

if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Tests failed"
    exit 1
fi

echo "🎉 PersonaChain Identity Module build complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Copy the x/identity folder to your PersonaChain source"
echo "   2. Register the module in app.go"
echo "   3. Add module to genesis.json"
echo "   4. Rebuild PersonaChain daemon"
echo ""
echo "Example app.go integration:"
echo "   import identity \"github.com/PersonaPass-ID/persona-chain/x/identity\""
echo "   ..."
echo "   app.IdentityKeeper = identity.NewKeeper(...)"
echo "   ..."
echo "   app.mm = module.NewManager("
echo "     identity.NewAppModule(app.IdentityKeeper),"
echo "     ..."
echo "   )"