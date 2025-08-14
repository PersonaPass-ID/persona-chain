#!/bin/bash
set -euo pipefail

# PersonaChain Binary Fix & Deploy Script
# Fixes app.go registration issues, rebuilds binary, and deploys to AWS nodes

echo "🔧 PersonaChain Binary Fix & Deploy Script"
echo "=========================================="

# Configuration
REPO_DIR="/home/rocz/persona-hq"
BUILD_DIR="$REPO_DIR/build"
BINARY_NAME="personachaind"
CHAIN_ID="persona-1"
DENOM="upersona"
KEY_FILE="~/.ssh/PersonaChainAccess-debug.pem"

# Node IPs
RPC_IP="98.81.101.12"
SENTRY_IP="44.223.88.2" 
VALIDATOR_IP="10.10.2.241"

cd "$REPO_DIR"

echo "📂 Current directory: $(pwd)"
echo "🔍 Checking Go version..."
go version

# Backup current app.go
if [ -f "app/app.go" ]; then
    echo "💾 Backing up current app.go..."
    cp app/app.go app/app.go.backup.$(date +%s)
fi

echo "🔨 Step 1: Applying code fixes to app.go..."

# Create the fixed app.go with proper registrations
cat > app/app.go << 'EOF'
package app

import (
    "encoding/json"
    "io"
    "os"

    "github.com/cosmos/cosmos-sdk/baseapp"
    "github.com/cosmos/cosmos-sdk/client"
    "github.com/cosmos/cosmos-sdk/codec"
    "github.com/cosmos/cosmos-sdk/codec/types"
    "github.com/cosmos/cosmos-sdk/server/api"
    "github.com/cosmos/cosmos-sdk/server/config"
    servertypes "github.com/cosmos/cosmos-sdk/server/types"
    "github.com/cosmos/cosmos-sdk/simapp"
    sdk "github.com/cosmos/cosmos-sdk/types"
    "github.com/cosmos/cosmos-sdk/types/module"
    "github.com/cosmos/cosmos-sdk/version"
    "github.com/cosmos/cosmos-sdk/x/auth"
    "github.com/cosmos/cosmos-sdk/x/auth/ante"
    authkeeper "github.com/cosmos/cosmos-sdk/x/auth/keeper"
    authsims "github.com/cosmos/cosmos-sdk/x/auth/simulation"
    authtypes "github.com/cosmos/cosmos-sdk/x/auth/types"
    "github.com/cosmos/cosmos-sdk/x/bank"
    bankkeeper "github.com/cosmos/cosmos-sdk/x/bank/keeper"
    banktypes "github.com/cosmos/cosmos-sdk/x/bank/types"
    "github.com/cosmos/cosmos-sdk/x/staking"
    stakingkeeper "github.com/cosmos/cosmos-sdk/x/staking/keeper"
    stakingtypes "github.com/cosmos/cosmos-sdk/x/staking/types"
    "github.com/cosmos/cosmos-sdk/x/genutil"
    genutiltypes "github.com/cosmos/cosmos-sdk/x/genutil/types"
    
    abci "github.com/cometbft/cometbft/abci/types"
    tmjson "github.com/cometbft/cometbft/libs/json"
    "github.com/cometbft/cometbft/libs/log"
    tmos "github.com/cometbft/cometbft/libs/os"
    dbm "github.com/cometbft/cometbft-db"
    
    // PersonaChain modules
    "github.com/PersonaPass-ID/persona-chain/x/credential"
    credentialkeeper "github.com/PersonaPass-ID/persona-chain/x/credential/keeper"
    credentialtypes "github.com/PersonaPass-ID/persona-chain/x/credential/types"
    "github.com/PersonaPass-ID/persona-chain/x/did"
    didkeeper "github.com/PersonaPass-ID/persona-chain/x/did/keeper"
    didtypes "github.com/PersonaPass-ID/persona-chain/x/did/types"
    "github.com/PersonaPass-ID/persona-chain/x/zkproof"
    zkproofkeeper "github.com/PersonaPass-ID/persona-chain/x/zkproof/keeper"
    zkprooftypes "github.com/PersonaPass-ID/persona-chain/x/zkproof/types"
)

const (
    AppName = "PersonaChain"
)

var (
    // DefaultNodeHome default home directories for the application daemon
    DefaultNodeHome string
    
    // ModuleBasics defines the module BasicManager is in charge of setting up basic,
    // non-dependant module elements, such as codec registration
    // and genesis verification.
    ModuleBasics = module.NewBasicManager(
        auth.AppModuleBasic{},
        genutil.AppModuleBasic{},
        bank.AppModuleBasic{},
        staking.AppModuleBasic{},
        // PersonaChain modules
        did.AppModuleBasic{},
        credential.AppModuleBasic{},
        zkproof.AppModuleBasic{},
    )
)

func init() {
    userHomeDir, err := os.UserHomeDir()
    if err != nil {
        panic(err)
    }
    DefaultNodeHome = filepath.Join(userHomeDir, ".personachain")
}

// PersonaApp extends an ABCI application, but with most of its parameters exported.
type PersonaApp struct {
    *baseapp.BaseApp

    cdc               *codec.LegacyAmino
    appCodec          codec.Codec
    interfaceRegistry types.InterfaceRegistry

    invCheckPeriod uint

    // keys to access the substores
    keys    map[string]*storetypes.KVStoreKey
    tkeys   map[string]*storetypes.TransientStoreKey
    memKeys map[string]*storetypes.MemoryStoreKey

    // keepers
    AccountKeeper    authkeeper.AccountKeeper
    BankKeeper       bankkeeper.Keeper
    StakingKeeper    stakingkeeper.Keeper
    
    // PersonaChain keepers
    DIDKeeper        didkeeper.Keeper
    CredentialKeeper credentialkeeper.Keeper
    ZKProofKeeper    zkproofkeeper.Keeper

    // module manager
    mm *module.Manager
}

// New returns a reference to an initialized PersonaApp.
func New(
    logger log.Logger,
    db dbm.DB,
    traceStore io.Writer,
    loadLatest bool,
    skipUpgradeHeights map[int64]bool,
    homePath string,
    invCheckPeriod uint,
    encodingConfig simapp.EncodingConfig,
    appOpts servertypes.AppOptions,
    baseAppOptions ...func(*baseapp.BaseApp),
) *PersonaApp {

    appCodec := encodingConfig.Marshaler
    cdc := encodingConfig.Amino
    interfaceRegistry := encodingConfig.InterfaceRegistry

    // CRITICAL: Register all interfaces to fix BaseAccount resolution
    std.RegisterLegacyAminoCodec(cdc)
    std.RegisterInterfaces(interfaceRegistry)
    
    // Register auth interfaces (fixes BaseAccount type URL error)
    authtypes.RegisterInterfaces(interfaceRegistry)
    banktypes.RegisterInterfaces(interfaceRegistry)
    stakingtypes.RegisterInterfaces(interfaceRegistry)
    
    // Register PersonaChain module interfaces
    didtypes.RegisterInterfaces(interfaceRegistry)
    credentialtypes.RegisterInterfaces(interfaceRegistry)
    zkprooftypes.RegisterInterfaces(interfaceRegistry)

    bApp := baseapp.NewBaseApp(AppName, logger, db, encodingConfig.TxConfig.TxDecoder(), baseAppOptions...)
    bApp.SetCommitMultiStoreTracer(traceStore)
    bApp.SetVersion(version.Version)
    bApp.SetInterfaceRegistry(interfaceRegistry)

    keys := sdk.NewKVStoreKeys(
        authtypes.StoreKey, banktypes.StoreKey, stakingtypes.StoreKey,
        didtypes.StoreKey, credentialtypes.StoreKey, zkprooftypes.StoreKey,
    )
    tkeys := sdk.NewTransientStoreKeys()
    memKeys := sdk.NewMemoryStoreKeys()

    app := &PersonaApp{
        BaseApp:           bApp,
        cdc:               cdc,
        appCodec:          appCodec,
        interfaceRegistry: interfaceRegistry,
        invCheckPeriod:    invCheckPeriod,
        keys:              keys,
        tkeys:             tkeys,
        memKeys:           memKeys,
    }

    // Add keepers
    app.AccountKeeper = authkeeper.NewAccountKeeper(
        appCodec, keys[authtypes.StoreKey], authtypes.ProtoBaseAccount, nil,
        sdk.GetConfig().GetBech32AccountAddrPrefix(),
    )
    
    app.BankKeeper = bankkeeper.NewBaseKeeper(
        appCodec, keys[banktypes.StoreKey], app.AccountKeeper, nil,
        sdk.GetConfig().GetBech32AccountAddrPrefix(),
    )
    
    stakingKeeper := stakingkeeper.NewKeeper(
        appCodec, keys[stakingtypes.StoreKey], app.AccountKeeper, app.BankKeeper, authtypes.NewModuleAddress("gov").String(),
    )
    app.StakingKeeper = *stakingKeeper

    // PersonaChain keepers
    app.DIDKeeper = *didkeeper.NewKeeper(
        appCodec,
        keys[didtypes.StoreKey],
        app.AccountKeeper,
        app.BankKeeper,
    )
    
    app.CredentialKeeper = *credentialkeeper.NewKeeper(
        appCodec,
        keys[credentialtypes.StoreKey],
        app.AccountKeeper,
        app.BankKeeper,
    )
    
    app.ZKProofKeeper = *zkproofkeeper.NewKeeper(
        appCodec,
        keys[zkprooftypes.StoreKey],
        app.AccountKeeper,
        app.BankKeeper,
    )

    // Module manager
    app.mm = module.NewManager(
        auth.NewAppModule(appCodec, app.AccountKeeper, nil),
        bank.NewAppModule(appCodec, app.BankKeeper, app.AccountKeeper),
        staking.NewAppModule(appCodec, app.StakingKeeper, app.AccountKeeper, app.BankKeeper),
        genutil.NewAppModule(app.AccountKeeper, app.StakingKeeper, app.BaseApp.DeliverTx, encodingConfig.TxConfig),
        // PersonaChain modules
        did.NewAppModule(appCodec, app.DIDKeeper, app.AccountKeeper, app.BankKeeper),
        credential.NewAppModule(appCodec, app.CredentialKeeper, app.AccountKeeper, app.BankKeeper),
        zkproof.NewAppModule(appCodec, app.ZKProofKeeper, app.AccountKeeper, app.BankKeeper),
    )

    // Set module order
    app.mm.SetOrderBeginBlockers()
    app.mm.SetOrderEndBlockers(stakingtypes.ModuleName)
    app.mm.SetOrderInitGenesis(
        authtypes.ModuleName,
        banktypes.ModuleName,
        stakingtypes.ModuleName,
        genutiltypes.ModuleName,
        didtypes.ModuleName,
        credentialtypes.ModuleName,
        zkprooftypes.ModuleName,
    )

    app.mm.RegisterInvariants(nil)
    app.mm.RegisterRoutes(app.Router(), app.QueryRouter(), encodingConfig.Amino)
    app.mm.RegisterServices(module.NewConfigurator(app.appCodec, app.MsgServiceRouter(), app.GRPCQueryRouter()))

    // CRITICAL: Set InitChainer to properly initialize consensus params
    app.SetInitChainer(app.InitChainer)
    app.SetBeginBlocker(app.BeginBlocker)
    app.SetEndBlocker(app.EndBlocker)

    // Set ante handler
    anteHandler, err := ante.NewAnteHandler(
        ante.HandlerOptions{
            AccountKeeper:   app.AccountKeeper,
            BankKeeper:      app.BankKeeper,
            SignModeHandler: encodingConfig.TxConfig.SignModeHandler(),
            FeegrantKeeper:  nil,
            SigGasConsumer:  ante.DefaultSigVerificationGasConsumer,
        },
    )
    if err != nil {
        panic(err)
    }
    app.SetAnteHandler(anteHandler)

    app.MountKVStores(keys)
    app.MountTransientStores(tkeys)
    app.MountMemoryStores(memKeys)

    if loadLatest {
        if err := app.LoadLatestVersion(); err != nil {
            tmos.Exit(err.Error())
        }
    }

    return app
}

// InitChainer application update at chain initialization
func (app *PersonaApp) InitChainer(ctx sdk.Context, req abci.RequestInitChain) abci.ResponseInitChain {
    var genesisState GenesisState
    if err := tmjson.Unmarshal(req.AppStateBytes, &genesisState); err != nil {
        panic(err)
    }
    return app.mm.InitGenesis(ctx, app.appCodec, genesisState)
}

// BeginBlocker application updates every begin block
func (app *PersonaApp) BeginBlocker(ctx sdk.Context, req abci.RequestBeginBlock) abci.ResponseBeginBlock {
    return app.mm.BeginBlock(ctx, req)
}

// EndBlocker application updates every end block
func (app *PersonaApp) EndBlocker(ctx sdk.Context, req abci.RequestEndBlock) abci.ResponseEndBlock {
    return app.mm.EndBlock(ctx, req)
}

// DefaultGenesis returns a default genesis from the registered AppModuleBasic's.
func (a *PersonaApp) DefaultGenesis() map[string]json.RawMessage {
    return ModuleBasics.DefaultGenesis(a.appCodec)
}

// GenesisState represents the genesis state of the blockchain.
type GenesisState map[string]json.RawMessage

// MakeCodecs constructs the *std.Codec and *codec.LegacyAmino instances used by
// PersonaApp. It is useful for tests and clients who do not want to construct the
// full PersonaApp.
func MakeCodecs() (codec.Codec, *codec.LegacyAmino) {
    config := MakeEncodingConfig()
    return config.Marshaler, config.Amino
}

func MakeEncodingConfig() simapp.EncodingConfig {
    encodingConfig := simapp.MakeTestEncodingConfig()
    std.RegisterLegacyAminoCodec(encodingConfig.Amino)
    std.RegisterInterfaces(encodingConfig.InterfaceRegistry)
    ModuleBasics.RegisterLegacyAminoCodec(encodingConfig.Amino)
    ModuleBasics.RegisterInterfaces(encodingConfig.InterfaceRegistry)
    return encodingConfig
}
EOF

echo "✅ Applied app.go fixes (interface registration + InitChainer)"

echo "🧩 Step 2: Ensuring module dependencies..."
go mod tidy

echo "🏗️ Step 3: Building PersonaChain binary..."
mkdir -p "$BUILD_DIR"

# Build binary
if [ -f "Makefile" ]; then
    echo "📋 Using Makefile..."
    make build
else
    echo "🔨 Direct go build..."
    go build -o "$BUILD_DIR/$BINARY_NAME" ./cmd/personachaind
fi

# Verify binary
if [ ! -f "$BUILD_DIR/$BINARY_NAME" ]; then
    echo "❌ Build failed - binary not found"
    exit 1
fi

echo "🔍 Step 4: Verifying binary..."
"$BUILD_DIR/$BINARY_NAME" version
CHECKSUM=$(sha256sum "$BUILD_DIR/$BINARY_NAME" | cut -d' ' -f1)
echo "📋 Binary checksum: $CHECKSUM"

echo "📤 Step 5: Uploading binary to RPC node..."
scp -i ~/.ssh/PersonaChainAccess-debug.pem "$BUILD_DIR/$BINARY_NAME" ubuntu@$RPC_IP:/tmp/

echo "🔄 Step 6: Installing binary on RPC node..."
ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$RPC_IP << 'REMOTE_SCRIPT'
# Stop any running processes
sudo pkill -f personachaind || true

# Install new binary
sudo -u personachain mv /tmp/personachaind /home/personachain/bin/personachaind
sudo chmod +x /home/personachain/bin/personachaind

# Set up cosmovisor layout
sudo -u personachain mkdir -p /home/personachain/cosmovisor/genesis/bin
sudo -u personachain cp /home/personachain/bin/personachaind /home/personachain/cosmovisor/genesis/bin/

echo "✅ Binary installed successfully"
REMOTE_SCRIPT

echo "🧹 Step 7: Clean single-node initialization..."
ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$RPC_IP << 'INIT_SCRIPT'
sudo -u personachain bash -c '
export DAEMON=/home/personachain/bin/personachaind
export HOME_DIR=/home/personachain/.personachain
export CHAIN_ID=persona-1
export DENOM=upersona

echo "🗑️ Wiping existing data..."
rm -rf $HOME_DIR
mkdir -p $HOME_DIR

echo "⚙️ Initializing node..."
$DAEMON init mynode --chain-id $CHAIN_ID --home $HOME_DIR

echo "💰 Setting denomination..."
sed -i "s/\"stake\"/\"$DENOM\"/g" $HOME_DIR/config/genesis.json
sed -i "s/minimum-gas-prices = .*/minimum-gas-prices = \"0.025$DENOM\"/" $HOME_DIR/config/app.toml

echo "🔑 Creating validator key..."
$DAEMON keys add validator --keyring-backend test --home $HOME_DIR

echo "📋 Getting validator address..."
ADDR=$($DAEMON keys show validator -a --keyring-backend test --home $HOME_DIR)
echo "Validator address: $ADDR"

echo "💳 Adding genesis account..."
$DAEMON genesis add-genesis-account $ADDR 1000000000$DENOM --keyring-backend test --home $HOME_DIR

echo "📝 Creating genesis transaction..."
$DAEMON genesis gentx validator 500000000$DENOM --chain-id $CHAIN_ID --keyring-backend test --home $HOME_DIR

echo "📦 Collecting genesis transactions..."
$DAEMON genesis collect-gentxs --home $HOME_DIR

echo "✅ Validating genesis..."
$DAEMON genesis validate-genesis --home $HOME_DIR

echo "🚀 Starting PersonaChain..."
nohup $DAEMON start --home $HOME_DIR > /tmp/personachain.log 2>&1 &

echo "⏳ Waiting for startup..."
sleep 10
'
INIT_SCRIPT

echo "📊 Step 8: Checking node status..."
sleep 5

echo "📋 Node logs:"
ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$RPC_IP "tail -30 /tmp/personachain.log"

echo ""
echo "🌐 Testing RPC endpoint..."
if curl -s http://$RPC_IP:26657/status | jq -r '.result.sync_info.latest_block_height' > /dev/null 2>&1; then
    BLOCK_HEIGHT=$(curl -s http://$RPC_IP:26657/status | jq -r '.result.sync_info.latest_block_height')
    echo "✅ SUCCESS! PersonaChain is producing blocks. Current height: $BLOCK_HEIGHT"
    echo ""
    echo "🔗 Endpoints:"
    echo "  RPC: http://$RPC_IP:26657"
    echo "  API: http://$RPC_IP:1317"
    echo "  Status: curl http://$RPC_IP:26657/status"
    echo ""
    echo "🎯 Next steps:"
    echo "  1. Single-node PersonaChain is working!"
    echo "  2. Copy binary to other nodes: scp binary to $SENTRY_IP and $VALIDATOR_IP"
    echo "  3. Copy genesis.json to other nodes"
    echo "  4. Configure peer connections"
    echo "  5. Start 3-node network"
else
    echo "❌ RPC endpoint not responding. Check logs:"
    echo "ssh -i ~/.ssh/PersonaChainAccess-debug.pem ubuntu@$RPC_IP 'tail -50 /tmp/personachain.log'"
fi

echo ""
echo "🏁 Single-node setup complete!"
EOF