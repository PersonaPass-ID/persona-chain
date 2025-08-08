package app

import (
	"context"
	"encoding/json"
	"io"
	"os"
	"path/filepath"

	"cosmossdk.io/core/address"
	"cosmossdk.io/log"
	storetypes "cosmossdk.io/store/types"
	"cosmossdk.io/x/upgrade"
	upgradekeeper "cosmossdk.io/x/upgrade/keeper"
	upgradetypes "cosmossdk.io/x/upgrade/types"
	abci "github.com/cometbft/cometbft/abci/types"
	tmjson "github.com/cometbft/cometbft/libs/json"
	tmproto "github.com/cometbft/cometbft/proto/tendermint/types"
	dbm "github.com/cosmos/cosmos-db"
	"github.com/cosmos/cosmos-sdk/baseapp"
	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/codec"
	codectypes "github.com/cosmos/cosmos-sdk/codec/types"
	"github.com/cosmos/cosmos-sdk/runtime"
	"github.com/cosmos/cosmos-sdk/server/api"
	"github.com/cosmos/cosmos-sdk/server/config"
	servertypes "github.com/cosmos/cosmos-sdk/server/types"
	"github.com/cosmos/cosmos-sdk/std"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/module"
	"github.com/cosmos/cosmos-sdk/version"
	"github.com/cosmos/cosmos-sdk/x/auth"
	"github.com/cosmos/cosmos-sdk/x/auth/ante"
	authkeeper "github.com/cosmos/cosmos-sdk/x/auth/keeper"
	authtx "github.com/cosmos/cosmos-sdk/x/auth/tx"
	authtypes "github.com/cosmos/cosmos-sdk/x/auth/types"
	"github.com/cosmos/cosmos-sdk/x/bank"
	bankkeeper "github.com/cosmos/cosmos-sdk/x/bank/keeper"
	banktypes "github.com/cosmos/cosmos-sdk/x/bank/types"
	"github.com/cosmos/cosmos-sdk/x/consensus"
	consensuskeeper "github.com/cosmos/cosmos-sdk/x/consensus/keeper"
	consensustypes "github.com/cosmos/cosmos-sdk/x/consensus/types"
	"github.com/cosmos/cosmos-sdk/x/genutil"
	genutiltypes "github.com/cosmos/cosmos-sdk/x/genutil/types"
	"github.com/cosmos/cosmos-sdk/x/staking"
	stakingkeeper "github.com/cosmos/cosmos-sdk/x/staking/keeper"
	stakingtypes "github.com/cosmos/cosmos-sdk/x/staking/types"
	
	// Import our custom modules
	didmodule "github.com/PersonaPass-ID/personachain/x/did"
	didkeeper "github.com/PersonaPass-ID/personachain/x/did/keeper"
	didtypes "github.com/PersonaPass-ID/personachain/x/did/types"

	credentialmodule "github.com/PersonaPass-ID/personachain/x/credential"
	credentialkeeper "github.com/PersonaPass-ID/personachain/x/credential/keeper"
	credentialtypes "github.com/PersonaPass-ID/personachain/x/credential/types"

	zkproofmodule "github.com/PersonaPass-ID/personachain/x/zkproof"
	zkproofkeeper "github.com/PersonaPass-ID/personachain/x/zkproof/keeper"
	zkprooftypes "github.com/PersonaPass-ID/personachain/x/zkproof/types"
)

const (
	AccountAddressPrefix = "persona"
	Name                 = "personachain"
)

var (
	DefaultNodeHome string

	// module account permissions
	maccPerms = map[string][]string{
		authtypes.FeeCollectorName:     nil,
		stakingtypes.BondedPoolName:    {authtypes.Burner, authtypes.Staking},
		stakingtypes.NotBondedPoolName: {authtypes.Burner, authtypes.Staking},
		didtypes.ModuleName:            {},
		credentialtypes.ModuleName:     {},
		zkprooftypes.ModuleName:        {},
	}

	// ModuleBasics defines the module BasicManager is in charge of setting up basic,
	// non-dependant module elements, such as codec registration
	// and genesis verification.
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

// PersonaChainAppNew extends an ABCI application, built with the Cosmos SDK's ABCI framework.
type PersonaChainAppNew struct {
	*baseapp.BaseApp

	legacyAmino       *codec.LegacyAmino
	appCodec          codec.Codec
	txConfig          client.TxConfig
	interfaceRegistry codectypes.InterfaceRegistry

	// keys to access the substores
	keys    map[string]*storetypes.KVStoreKey
	tkeys   map[string]*storetypes.TransientStoreKey
	memKeys map[string]*storetypes.MemoryStoreKey

	// keepers
	AuthKeeper       authkeeper.AccountKeeper
	BankKeeper       bankkeeper.Keeper
	StakingKeeper    *stakingkeeper.Keeper
	UpgradeKeeper    *upgradekeeper.Keeper
	ConsensusKeeper  consensuskeeper.Keeper

	// PersonaChain custom keepers
	DIDKeeper        didkeeper.Keeper
	CredentialKeeper credentialkeeper.Keeper
	ZKProofKeeper    zkproofkeeper.Keeper

	// the module manager
	ModuleManager *module.Manager

	// simulation manager
	configurator module.Configurator
}

// NewPersonaChainApp returns a reference to an initialized PersonaChain application.
func NewPersonaChainAppNew(
	logger log.Logger,
	db dbm.DB,
	traceStore io.Writer,
	loadLatest bool,
	appOpts servertypes.AppOptions,
	baseAppOptions ...func(*baseapp.BaseApp),
) *PersonaChainAppNew {

	interfaceRegistry := codectypes.NewInterfaceRegistry()
	appCodec := codec.NewProtoCodec(interfaceRegistry)
	legacyAmino := codec.NewLegacyAmino()
	txConfig := authtx.NewTxConfig(appCodec, authtx.DefaultSignModes)

	// Register standard interfaces
	std.RegisterLegacyAminoCodec(legacyAmino)
	std.RegisterInterfaces(interfaceRegistry)

	// Register module basics
	ModuleBasics.RegisterLegacyAminoCodec(legacyAmino)
	ModuleBasics.RegisterInterfaces(interfaceRegistry)

	bApp := baseapp.NewBaseApp(Name, logger, db, txConfig.TxDecoder(), baseAppOptions...)
	bApp.SetCommitMultiStoreTracer(traceStore)
	bApp.SetVersion(version.Version)
	bApp.SetInterfaceRegistry(interfaceRegistry)
	bApp.SetTxEncoder(txConfig.TxEncoder())

	keys := storetypes.NewKVStoreKeys(
		authtypes.StoreKey, banktypes.StoreKey, stakingtypes.StoreKey,
		upgradetypes.StoreKey, consensustypes.StoreKey,
		// PersonaChain store keys - disabled for now
		// didtypes.StoreKey, credentialtypes.StoreKey, zkprooftypes.StoreKey,
	)

	tkeys := storetypes.NewTransientStoreKeys(
		stakingtypes.TStoreKey,
	)
	memKeys := storetypes.NewMemoryStoreKeys()

	app := &PersonaChainAppNew{
		BaseApp:           bApp,
		legacyAmino:       legacyAmino,
		appCodec:          appCodec,
		txConfig:          txConfig,
		interfaceRegistry: interfaceRegistry,
		keys:              keys,
		tkeys:             tkeys,
		memKeys:           memKeys,
	}

	authority := authtypes.NewModuleAddress("gov")

	// Initialize keepers  
	app.AuthKeeper = authkeeper.NewAccountKeeper(
		appCodec,
		runtime.NewKVStoreService(keys[authtypes.StoreKey]),
		authtypes.ProtoBaseAccount,
		maccPerms,
		address.NewBech32Codec(AccountAddressPrefix),
		AccountAddressPrefix,
		authority.String(),
	)

	app.BankKeeper = bankkeeper.NewBaseKeeper(
		appCodec,
		runtime.NewKVStoreService(keys[banktypes.StoreKey]),
		app.AuthKeeper,
		BlockedModuleAccountAddrs(),
		authority.String(),
		logger,
	)

	app.StakingKeeper = stakingkeeper.NewKeeper(
		appCodec,
		runtime.NewKVStoreService(keys[stakingtypes.StoreKey]),
		app.AuthKeeper,
		app.BankKeeper,
		authority.String(),
		address.NewBech32Codec(sdk.GetConfig().GetBech32ValidatorAddrPrefix()),
		address.NewBech32Codec(sdk.GetConfig().GetBech32ConsensusAddrPrefix()),
	)

	app.UpgradeKeeper = upgradekeeper.NewKeeper(
		make(map[int64]bool),
		runtime.NewKVStoreService(keys[upgradetypes.StoreKey]),
		appCodec,
		DefaultNodeHome,
		app.BaseApp,
		authority.String(),
	)

	app.ConsensusKeeper = consensuskeeper.NewKeeper(
		appCodec,
		runtime.NewKVStoreService(keys[consensustypes.StoreKey]),
		authority.String(),
		runtime.EventService{},
	)

	// Initialize PersonaChain keepers
	app.DIDKeeper = *didkeeper.NewKeeper(
		appCodec,
		keys[didtypes.StoreKey],
		logger,
		app.BankKeeper,
		app.AuthKeeper,
		authority.String(),
	)

	app.CredentialKeeper = *credentialkeeper.NewKeeper(
		appCodec,
		runtime.NewKVStoreService(keys[credentialtypes.StoreKey]),
		authority.String(),
		app.AuthKeeper,
		app.BankKeeper,
	)

	app.ZKProofKeeper = *zkproofkeeper.NewKeeper(
		appCodec,
		runtime.NewKVStoreService(keys[zkprooftypes.StoreKey]),
		authority.String(),
		app.AuthKeeper,
		app.BankKeeper,
		&app.DIDKeeper,
	)

	/****  Module Managers ****/
	app.ModuleManager = module.NewManager(
		// SDK modules
		genutil.NewAppModule(
			app.AuthKeeper,
			app.StakingKeeper,
			app,
			txConfig,
		),
		auth.NewAppModule(appCodec, app.AuthKeeper, nil, app.txConfig),
		bank.NewAppModule(appCodec, app.BankKeeper, app.AuthKeeper, nil),
		staking.NewAppModule(appCodec, app.StakingKeeper, app.AuthKeeper, app.BankKeeper, nil),
		upgrade.NewAppModule(app.UpgradeKeeper, app.AuthKeeper),
		consensus.NewAppModule(appCodec, app.ConsensusKeeper),
		// PersonaChain modules
		didmodule.NewAppModule(appCodec, app.DIDKeeper),
		credentialmodule.NewAppModule(appCodec, app.CredentialKeeper),
		zkproofmodule.NewAppModule(appCodec, app.ZKProofKeeper),
	)

	// Set order of init genesis
	app.ModuleManager.SetOrderInitGenesis(
		authtypes.ModuleName,
		banktypes.ModuleName,
		stakingtypes.ModuleName,
		genutiltypes.ModuleName,
		upgradetypes.ModuleName,
		consensustypes.ModuleName,
		didtypes.ModuleName,
		credentialtypes.ModuleName,
		zkprooftypes.ModuleName,
	)

	app.ModuleManager.SetOrderExportGenesis(
		zkprooftypes.ModuleName,
		credentialtypes.ModuleName,
		didtypes.ModuleName,
		consensustypes.ModuleName,
		upgradetypes.ModuleName,
		stakingtypes.ModuleName,
		banktypes.ModuleName,
		authtypes.ModuleName,
		genutiltypes.ModuleName,
	)

	// Sets the order of set begin blocker calls
	app.ModuleManager.SetOrderBeginBlockers(
		upgradetypes.ModuleName,
		stakingtypes.ModuleName,
		didtypes.ModuleName,
		credentialtypes.ModuleName,
		zkprooftypes.ModuleName,
	)

	// Sets the order of set end blocker calls
	app.ModuleManager.SetOrderEndBlockers(
		stakingtypes.ModuleName,
		didtypes.ModuleName,
		credentialtypes.ModuleName,
		zkprooftypes.ModuleName,
	)

	app.configurator = module.NewConfigurator(app.appCodec, app.MsgServiceRouter(), app.GRPCQueryRouter())
	app.ModuleManager.RegisterServices(app.configurator)

	// initialize stores
	app.MountKVStores(keys)
	app.MountTransientStores(tkeys)
	app.MountMemoryStores(memKeys)

	// initialize BaseApp
	app.SetInitChainer(app.InitChainer)
	app.SetBeginBlocker(app.BeginBlocker)
	
	anteHandler, err := ante.NewAnteHandler(
		ante.HandlerOptions{
			AccountKeeper:   app.AuthKeeper,
			BankKeeper:      app.BankKeeper,
			SignModeHandler: txConfig.SignModeHandler(),
			FeegrantKeeper:  nil,
			SigGasConsumer:  ante.DefaultSigVerificationGasConsumer,
		},
	)
	if err != nil {
		panic(err)
	}

	app.SetAnteHandler(anteHandler)
	app.SetEndBlocker(app.EndBlocker)

	if loadLatest {
		if err := app.LoadLatestVersion(); err != nil {
			panic(err)
		}
	}

	return app
}

// Name returns the name of the App
func (app *PersonaChainAppNew) Name() string { return app.BaseApp.Name() }

// BeginBlocker application updates every begin block
func (app *PersonaChainAppNew) BeginBlocker(ctx sdk.Context) (sdk.BeginBlock, error) {
	return app.ModuleManager.BeginBlock(ctx)
}

// EndBlocker application updates every end block
func (app *PersonaChainAppNew) EndBlocker(ctx sdk.Context) (sdk.EndBlock, error) {
	return app.ModuleManager.EndBlock(ctx)
}

// InitChainer application update at chain initialization  
func (app *PersonaChainAppNew) InitChainer(ctx sdk.Context, req *abci.RequestInitChain) (*abci.ResponseInitChain, error) {
	var genesisState GenesisState
	if err := tmjson.Unmarshal(req.AppStateBytes, &genesisState); err != nil {
		panic(err)
	}
	app.UpgradeKeeper.SetModuleVersionMap(ctx, app.ModuleManager.GetVersionMap())
	return app.ModuleManager.InitGenesis(ctx, app.appCodec, genesisState)
}

// LoadHeight loads a particular height
func (app *PersonaChainAppNew) LoadHeight(height int64) error {
	return app.LoadVersion(height)
}

// LegacyAmino returns legacy amino codec.
func (app *PersonaChainAppNew) LegacyAmino() *codec.LegacyAmino {
	return app.legacyAmino
}

// AppCodec returns an app codec.
func (app *PersonaChainAppNew) AppCodec() codec.Codec {
	return app.appCodec
}

// InterfaceRegistry returns an InterfaceRegistry
func (app *PersonaChainAppNew) InterfaceRegistry() codectypes.InterfaceRegistry {
	return app.interfaceRegistry
}

// TxConfig returns an TxConfig
func (app *PersonaChainAppNew) TxConfig() client.TxConfig {
	return app.txConfig
}

// DefaultGenesis returns a default genesis from the registered AppModuleBasic's.
func (app *PersonaChainAppNew) DefaultGenesis() map[string]json.RawMessage {
	return ModuleBasics.DefaultGenesis(app.appCodec)
}

// GetSubspace returns a param subspace for a given module name.
func (app *PersonaChainAppNew) GetSubspace(moduleName string) interface{} {
	return nil
}

// RegisterAPIRoutes registers all application module routes with the provided API server.
func (app *PersonaChainAppNew) RegisterAPIRoutes(apiSvr *api.Server, apiConfig config.APIConfig) {
	// Register legacy routes
	ModuleBasics.RegisterGRPCGatewayRoutes(apiSvr.ClientCtx, apiSvr.GRPCGatewayRouter)
}

// RegisterTxService implements the Application.RegisterTxService method.
func (app *PersonaChainAppNew) RegisterTxService(clientCtx client.Context) {
	authtx.RegisterTxService(app.BaseApp.GRPCQueryRouter(), clientCtx, app.BaseApp.Simulate, app.interfaceRegistry)
}

// RegisterTendermintService implements the Application.RegisterTendermintService method.
func (app *PersonaChainAppNew) RegisterTendermintService(clientCtx client.Context) {
	// Implementation if needed
}

// GetMaccPerms returns a copy of the module account permissions
func GetMaccPerms() map[string][]string {
	dupMaccPerms := make(map[string][]string)
	for k, v := range maccPerms {
		dupMaccPerms[k] = v
	}
	return dupMaccPerms
}

// BlockedModuleAccountAddrs returns all the app's blocked module account addresses.
func BlockedModuleAccountAddrs() map[string]bool {
	blockedAddrs := make(map[string]bool)
	for acc := range maccPerms {
		blockedAddrs[authtypes.NewModuleAddress(acc).String()] = true
	}
	return blockedAddrs
}

// ExportAppStateAndValidators exports the state of the application for a genesis file.
func (app *PersonaChainAppNew) ExportAppStateAndValidators(
	forZeroHeight bool, jailAllowedAddrs []string, modulesToExport []string,
) (servertypes.ExportedApp, error) {
	// as if they could withdraw from the start of the next block
	ctx := app.NewContext(true, tmproto.Header{Height: app.LastBlockHeight()})

	// We export at last height + 1, because that's the height at which
	// Tendermint will start InitChain.
	height := app.LastBlockHeight() + 1
	if forZeroHeight {
		height = 0
		app.prepForZeroHeightGenesis(ctx, jailAllowedAddrs)
	}

	genState, err := app.ModuleManager.ExportGenesisForModules(ctx, app.appCodec, modulesToExport)
	if err != nil {
		return servertypes.ExportedApp{}, err
	}

	appState, err := json.MarshalIndent(genState, "", "  ")
	if err != nil {
		return servertypes.ExportedApp{}, err
	}

	validators, err := staking.WriteValidators(ctx, app.StakingKeeper)
	return servertypes.ExportedApp{
		AppState:        appState,
		Validators:      validators,
		Height:          height,
		ConsensusParams: app.BaseApp.GetConsensusParams(ctx),
	}, err
}

// prepare for fresh start at zero height
func (app *PersonaChainAppNew) prepForZeroHeightGenesis(ctx sdk.Context, jailAllowedAddrs []string) {
	// Implementation for zero height genesis prep if needed
}

type GenesisState map[string]json.RawMessage

// NewDefaultGenesisState generates the default state for the application.
func NewDefaultGenesisState(cdc codec.JSONCodec) GenesisState {
	return ModuleBasics.DefaultGenesis(cdc)
}