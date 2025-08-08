package app

import (
	"io"
	"os"
	"path/filepath"

	"cosmossdk.io/depinject"
	"cosmossdk.io/log"
	storetypes "cosmossdk.io/store/types"
	"cosmossdk.io/x/upgrade"
	dbm "github.com/cosmos/cosmos-db"
	"github.com/cosmos/cosmos-sdk/baseapp"
	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/codec"
	codectypes "github.com/cosmos/cosmos-sdk/codec/types"
	"github.com/cosmos/cosmos-sdk/runtime"
	"github.com/cosmos/cosmos-sdk/server"
	"github.com/cosmos/cosmos-sdk/server/api"
	"github.com/cosmos/cosmos-sdk/server/config"
	servertypes "github.com/cosmos/cosmos-sdk/server/types"
	"github.com/cosmos/cosmos-sdk/std"
	"github.com/cosmos/cosmos-sdk/types/module"
	"github.com/cosmos/cosmos-sdk/x/auth"
	authkeeper "github.com/cosmos/cosmos-sdk/x/auth/keeper"
	authtx "github.com/cosmos/cosmos-sdk/x/auth/tx"
	"github.com/cosmos/cosmos-sdk/x/bank"
	bankkeeper "github.com/cosmos/cosmos-sdk/x/bank/keeper"
	"github.com/cosmos/cosmos-sdk/x/consensus"
	"github.com/cosmos/cosmos-sdk/x/genutil"
	genutiltypes "github.com/cosmos/cosmos-sdk/x/genutil/types"
	"github.com/cosmos/cosmos-sdk/x/staking"
	stakingkeeper "github.com/cosmos/cosmos-sdk/x/staking/keeper"
	upgradekeeper "cosmossdk.io/x/upgrade/keeper"
	
	// Import PersonaChain modules
	didmodule "github.com/personahq/personachain/x/did"
	credentialmodule "github.com/personahq/personachain/x/credential"
	zkproofmodule "github.com/personahq/personachain/x/zkproof"
	
	// Import PersonaChain keepers
	didkeeper "github.com/personahq/personachain/x/did/keeper"
	credentialkeeper "github.com/personahq/personachain/x/credential/keeper"
	zkproofkeeper "github.com/personahq/personachain/x/zkproof/keeper"
)

const (
	// Bech32MainPrefix is the main bech32 prefix for PersonaChain addresses
	Bech32MainPrefix = "persona"
	
	// PrefixAccount is the prefix for account keys
	PrefixAccount = "acc"
	// PrefixValidator is the prefix for validator keys
	PrefixValidator = "val"
	// PrefixConsensus is the prefix for consensus keys
	PrefixConsensus = "cons"
	// PrefixPublic is the prefix for public keys
	PrefixPublic = "pub"
	// PrefixOperator is the prefix for operator keys
	PrefixOperator = "oper"

	// Bech32PrefixAccAddr defines the Bech32 prefix of an account's address
	Bech32PrefixAccAddr = Bech32MainPrefix
	// Bech32PrefixAccPub defines the Bech32 prefix of an account's public key
	Bech32PrefixAccPub = Bech32MainPrefix + PrefixPublic
	// Bech32PrefixValAddr defines the Bech32 prefix of a validator's operator address
	Bech32PrefixValAddr = Bech32MainPrefix + PrefixValidator + PrefixOperator
	// Bech32PrefixValPub defines the Bech32 prefix of a validator's operator public key
	Bech32PrefixValPub = Bech32MainPrefix + PrefixValidator + PrefixOperator + PrefixPublic
	// Bech32PrefixConsAddr defines the Bech32 prefix of a consensus node address
	Bech32PrefixConsAddr = Bech32MainPrefix + PrefixValidator + PrefixConsensus
	// Bech32PrefixConsPub defines the Bech32 prefix of a consensus node public key
	Bech32PrefixConsPub = Bech32MainPrefix + PrefixValidator + PrefixConsensus + PrefixPublic
)

var (
	// DefaultNodeHome default home directories for PersonaChain
	DefaultNodeHome string

	// ModuleBasics defines the module BasicManager that is in charge of setting up basic,
	// non-dependant module elements, such as codec registration and genesis verification.
	ModuleBasics = module.NewBasicManager(
		auth.AppModuleBasic{},
		genutil.NewAppModuleBasic(genutiltypes.DefaultMessageValidator),
		bank.AppModuleBasic{},
		staking.AppModuleBasic{},
		upgrade.AppModuleBasic{},
		consensus.AppModuleBasic{},
		// PersonaChain modules
		didmodule.AppModuleBasic{},
		credentialmodule.AppModuleBasic{},
		zkproofmodule.AppModuleBasic{},
	)
)

func init() {
	userHomeDir, err := os.UserHomeDir()
	if err != nil {
		panic(err)
	}
	DefaultNodeHome = filepath.Join(userHomeDir, ".personachain")
}

// PersonaChainApp extends an ABCI application with PersonaChain modules
type PersonaChainApp struct {
	*runtime.App

	legacyAmino       *codec.LegacyAmino
	appCodec          codec.Codec
	txConfig          client.TxConfig
	interfaceRegistry codectypes.InterfaceRegistry

	// keys to access the substores
	keys    map[string]*storetypes.KVStoreKey
	tkeys   map[string]*storetypes.TransientStoreKey
	memKeys map[string]*storetypes.MemoryStoreKey

	// keepers
	AuthKeeper         authkeeper.AccountKeeper
	BankKeeper         bankkeeper.Keeper
	StakingKeeper      *stakingkeeper.Keeper
	UpgradeKeeper      *upgradekeeper.Keeper
	// PersonaChain keepers
	DIDKeeper          *didkeeper.Keeper
	CredentialKeeper   *credentialkeeper.Keeper
	ZKProofKeeper      *zkproofkeeper.Keeper

	// module manager
	ModuleManager *module.Manager

	// configurator
	configurator module.Configurator
}

// NewPersonaChainApp returns a reference to an initialized PersonaChain application.
func NewPersonaChainApp(
	logger log.Logger,
	db dbm.DB,
	traceStore io.Writer,
	loadLatest bool,
	appOpts servertypes.AppOptions,
	baseAppOptions ...func(*baseapp.BaseApp),
) *PersonaChainApp {

	var (
		app        = &PersonaChainApp{}
		appBuilder *runtime.AppBuilder
	)

	// PersonaChain application configuration using depinject
	if err := depinject.Inject(
		AppConfig,
		&appBuilder,
		&app.appCodec,
		&app.legacyAmino,
		&app.txConfig,
		&app.interfaceRegistry,
		&app.AuthKeeper,
		&app.BankKeeper,
		&app.StakingKeeper,
		&app.UpgradeKeeper,
		&app.DIDKeeper,
		&app.CredentialKeeper,
		&app.ZKProofKeeper,
	); err != nil {
		panic(err)
	}

	app.App = appBuilder.Build(db, traceStore, baseAppOptions...)

	// Load the app
	if loadLatest {
		if err := app.LoadLatestVersion(); err != nil {
			panic(err)
		}
	}

	return app
}

// Name returns the name of the App
func (app *PersonaChainApp) Name() string { return "personachain" }

// LegacyAmino returns PersonaChain's amino codec.
func (app *PersonaChainApp) LegacyAmino() *codec.LegacyAmino {
	return app.legacyAmino
}

// AppCodec returns PersonaChain's app codec.
func (app *PersonaChainApp) AppCodec() codec.Codec {
	return app.appCodec
}

// InterfaceRegistry returns PersonaChain's InterfaceRegistry
func (app *PersonaChainApp) InterfaceRegistry() codectypes.InterfaceRegistry {
	return app.interfaceRegistry
}

// TxConfig returns PersonaChain's TxConfig
func (app *PersonaChainApp) TxConfig() client.TxConfig {
	return app.txConfig
}

// GetKey returns the KVStoreKey for the provided store key.
func (app *PersonaChainApp) GetKey(storeKey string) *storetypes.KVStoreKey {
	sk := app.UnsafeFindStoreKey(storeKey)
	kvStoreKey, ok := sk.(*storetypes.KVStoreKey)
	if !ok {
		return nil
	}
	return kvStoreKey
}

// GetTKey returns the TransientStoreKey for the provided store key.
func (app *PersonaChainApp) GetTKey(storeKey string) *storetypes.TransientStoreKey {
	sk := app.UnsafeFindStoreKey(storeKey)
	transientStoreKey, ok := sk.(*storetypes.TransientStoreKey)
	if !ok {
		return nil
	}
	return transientStoreKey
}

// GetMemKey returns the MemStoreKey for the provided mem key.
func (app *PersonaChainApp) GetMemKey(storeKey string) *storetypes.MemoryStoreKey {
	sk := app.UnsafeFindStoreKey(storeKey)
	memoryStoreKey, ok := sk.(*storetypes.MemoryStoreKey)
	if !ok {
		return nil
	}
	return memoryStoreKey
}

// RegisterAPIRoutes registers all application module routes with the provided
// API server.
func (app *PersonaChainApp) RegisterAPIRoutes(apiSvr *api.Server, apiConfig config.APIConfig) {
	app.App.RegisterAPIRoutes(apiSvr, apiConfig)
	// register swagger API from root so that other applications can override easily
	if err := server.RegisterSwaggerAPI(apiSvr.ClientCtx, apiSvr.Router, false); err != nil {
		panic(err)
	}
}

// RegisterTxService implements the Application.RegisterTxService method.
func (app *PersonaChainApp) RegisterTxService(clientCtx client.Context) {
	app.App.RegisterTxService(clientCtx)
}

// RegisterTendermintService implements the Application.RegisterTendermintService method.
func (app *PersonaChainApp) RegisterTendermintService(clientCtx client.Context) {
	app.App.RegisterTendermintService(clientCtx)
}

// RegisterNodeService registers the node service.
func (app *PersonaChainApp) RegisterNodeService(clientCtx client.Context, cfg config.Config) {
	app.App.RegisterNodeService(clientCtx, cfg)
}

// GetMaccPerms returns a copy of the module account permissions
func GetMaccPerms() map[string][]string {
	dupMaccPerms := make(map[string][]string)
	for k, v := range maccPerms {
		dupMaccPerms[k] = v
	}
	return dupMaccPerms
}

// GetSubspace returns a param subspace for a given module name.
func (app *PersonaChainApp) GetSubspace(moduleName string) *storetypes.KVStoreKey {
	return app.GetKey(moduleName)
}

// SimulationManager implements the SimulationApp interface
func (app *PersonaChainApp) SimulationManager() *module.SimulationManager {
	return nil // For production, we don't need simulation
}

// LoadHeight loads a particular height
func (app *PersonaChainApp) LoadHeight(height int64) error {
	return app.App.LoadVersion(height)
}

// ExportAppStateAndValidators exports the state of the application for a genesis file.
func (app *PersonaChainApp) ExportAppStateAndValidators(
	forZeroHeight bool, jailAllowedAddrs, modulesToExport []string,
) (servertypes.ExportedApp, error) {
	
	// create context and multistore for export at current height
	ctx := app.NewContext(true)

	// Skip module initialization for export

	genState, err := app.ModuleManager.ExportGenesisForModules(ctx, app.appCodec, modulesToExport)
	if err != nil {
		return servertypes.ExportedApp{}, err
	}
	appState, err := codec.MarshalJSONIndent(app.legacyAmino, genState)
	if err != nil {
		return servertypes.ExportedApp{}, err
	}

	validators, err := staking.WriteValidators(ctx, app.StakingKeeper)
	return servertypes.ExportedApp{
		AppState:        appState,
		Validators:      validators,
		Height:          app.LastBlockHeight(),
		ConsensusParams: app.BaseApp.GetConsensusParams(ctx),
	}, err
}

// EncodingConfig specifies the concrete encoding types to use for a given app.
// This is provided for compatibility between protobuf and amino implementations.
type EncodingConfig struct {
	InterfaceRegistry codectypes.InterfaceRegistry
	Codec             codec.Codec
	TxConfig          client.TxConfig
	Amino             *codec.LegacyAmino
}

// MakeEncodingConfig creates an EncodingConfig for PersonaChain.
func MakeEncodingConfig() EncodingConfig {
	amino := codec.NewLegacyAmino()
	interfaceRegistry := codectypes.NewInterfaceRegistry()
	protoCodec := codec.NewProtoCodec(interfaceRegistry)
	txCfg := authtx.NewTxConfig(protoCodec, authtx.DefaultSignModes)

	std.RegisterLegacyAminoCodec(amino)
	std.RegisterInterfaces(interfaceRegistry)
	ModuleBasics.RegisterLegacyAminoCodec(amino)
	ModuleBasics.RegisterInterfaces(interfaceRegistry)

	return EncodingConfig{
		InterfaceRegistry: interfaceRegistry,
		Codec:             protoCodec,
		TxConfig:          txCfg,
		Amino:             amino,
	}
}

