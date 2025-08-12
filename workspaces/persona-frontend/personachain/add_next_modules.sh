#!/bin/bash

echo "🚀 ADDING NEXT 5 CRITICAL MODULES TO PERSONACHAIN"
echo "================================================"

# Add imports to app.go
echo "📝 Adding imports..."

# Add evidence, feegrant, authz, group, crisis modules
cat >> app/app.go << 'EOF'

	// Add next critical modules
	"github.com/cosmos/cosmos-sdk/x/evidence"
	evidencekeeper "github.com/cosmos/cosmos-sdk/x/evidence/keeper"
	evidencetypes "github.com/cosmos/cosmos-sdk/x/evidence/types"
	
	"github.com/cosmos/cosmos-sdk/x/feegrant"
	feegrantkeeper "github.com/cosmos/cosmos-sdk/x/feegrant/keeper"
	feegranttypes "github.com/cosmos/cosmos-sdk/x/feegrant/types"
	
	"github.com/cosmos/cosmos-sdk/x/authz"
	authzkeeper "github.com/cosmos/cosmos-sdk/x/authz/keeper"
	authztypes "github.com/cosmos/cosmos-sdk/x/authz/types"
	
	"github.com/cosmos/cosmos-sdk/x/group"
	groupkeeper "github.com/cosmos/cosmos-sdk/x/group/keeper"
	grouptypes "github.com/cosmos/cosmos-sdk/x/group/types"
	
	"github.com/cosmos/cosmos-sdk/x/crisis"
	crisiskeeper "github.com/cosmos/cosmos-sdk/x/crisis/keeper"
	crisistypes "github.com/cosmos/cosmos-sdk/x/crisis/types"
EOF

echo "✅ Added imports for 5 new modules!"
echo "📋 Next step: manually integrate keepers and module manager..."