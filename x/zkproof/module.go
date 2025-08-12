package zkproof

import (
	"context"
	"encoding/json"
	"fmt"

	"cosmossdk.io/core/appmodule"
	"cosmossdk.io/core/store"
	"cosmossdk.io/depinject"
	"cosmossdk.io/log"

	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/codec"
	codectypes "github.com/cosmos/cosmos-sdk/codec/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/module"
	simtypes "github.com/cosmos/cosmos-sdk/types/simulation"
	authtypes "github.com/cosmos/cosmos-sdk/x/auth/types"
	"github.com/grpc-ecosystem/grpc-gateway/runtime"
	"github.com/spf13/cobra"

	"github.com/PersonaPass-ID/personachain/x/zkproof/keeper"
	"github.com/PersonaPass-ID/personachain/x/zkproof/types"
)

// ConsensusVersion defines the current module consensus version.
const ConsensusVersion = 1

var (
	_ module.AppModule      = AppModule{}
	_ module.AppModuleBasic = AppModuleBasic{}
	_ appmodule.AppModule   = AppModule{}
)

// AppModuleBasic defines the basic application module used by the zkproof module.
type AppModuleBasic struct {
	cdc codec.Codec
}

// Name returns the zkproof module's name.
func (AppModuleBasic) Name() string { return types.ModuleName }

// RegisterLegacyAminoCodec registers the zkproof module's types on the LegacyAmino codec.
func (AppModuleBasic) RegisterLegacyAminoCodec(cdc *codec.LegacyAmino) {
	types.RegisterCodec(cdc)
}

// RegisterInterfaces registers interfaces and implementations of the zkproof module.
func (AppModuleBasic) RegisterInterfaces(registry codectypes.InterfaceRegistry) {
	types.RegisterInterfaces(registry)
}

// DefaultGenesis returns default genesis state as raw bytes for the zkproof
// module.
func (AppModuleBasic) DefaultGenesis(cdc codec.JSONCodec) json.RawMessage {
	return cdc.MustMarshalJSON(types.DefaultGenesis())
}

// ValidateGenesis performs genesis state validation for the zkproof module.
func (AppModuleBasic) ValidateGenesis(cdc codec.JSONCodec, config client.TxEncodingConfig, bz json.RawMessage) error {
	var data types.GenesisState
	if err := cdc.UnmarshalJSON(bz, &data); err != nil {
		return fmt.Errorf("failed to unmarshal %s genesis state: %w", types.ModuleName, err)
	}
	return data.Validate()
}

// RegisterGRPCGatewayRoutes registers the gRPC Gateway routes for the zkproof module.
func (AppModuleBasic) RegisterGRPCGatewayRoutes(clientCtx client.Context, mux *runtime.ServeMux) {
	// Register query routes when protobuf definitions are available
}

// GetTxCmd returns the root tx command for the zkproof module.
func (a AppModuleBasic) GetTxCmd() *cobra.Command {
	return nil // Will be implemented with CLI commands
}

// GetQueryCmd returns the root query command for the zkproof module.
func (AppModuleBasic) GetQueryCmd() *cobra.Command {
	return nil // Will be implemented with CLI commands
}

// AppModule implements an application module for the zkproof module.
type AppModule struct {
	AppModuleBasic

	keeper keeper.Keeper
}

// NewAppModule creates a new AppModule object.
func NewAppModule(cdc codec.Codec, keeper keeper.Keeper) AppModule {
	return AppModule{
		AppModuleBasic: AppModuleBasic{cdc: cdc},
		keeper:         keeper,
	}
}

// IsOnePerModuleType implements the depinject.OnePerModuleType interface.
func (am AppModule) IsOnePerModuleType() {}

// IsAppModule implements the appmodule.AppModule interface.
func (am AppModule) IsAppModule() {}

// Name returns the zkproof module's name.
func (AppModule) Name() string { return types.ModuleName }

// RegisterServices registers module services.
func (am AppModule) RegisterServices(cfg module.Configurator) {
	// Skip service registration for now - will implement after protobuf generation
	// types.RegisterMsgServer(cfg.MsgServer(), keeper.NewMsgServerImpl(am.keeper))
	// types.RegisterQueryServer(cfg.QueryServer(), keeper.NewQueryServerImpl(am.keeper))
}

// RegisterInvariants registers the zkproof module invariants.
func (am AppModule) RegisterInvariants(ir sdk.InvariantRegistry) {
	keeper.RegisterInvariants(ir, am.keeper)
}

// InitGenesis performs genesis initialization for the zkproof module.
func (am AppModule) InitGenesis(ctx sdk.Context, cdc codec.JSONCodec, data json.RawMessage) {
	var genesisState types.GenesisState
	cdc.MustUnmarshalJSON(data, &genesisState)
	am.keeper.InitGenesis(ctx, genesisState)
}

// ExportGenesis returns the exported genesis state as raw bytes for the zkproof
// module.
func (am AppModule) ExportGenesis(ctx sdk.Context, cdc codec.JSONCodec) json.RawMessage {
	gs := am.keeper.ExportGenesis(ctx)
	return cdc.MustMarshalJSON(gs)
}

// ConsensusVersion implements AppModule/ConsensusVersion.
func (AppModule) ConsensusVersion() uint64 { return ConsensusVersion }

// BeginBlock returns the begin blocker for the zkproof module.
func (am AppModule) BeginBlock(ctx context.Context) error {
	// Perform any begin block logic
	return nil
}

// EndBlock returns the end blocker for the zkproof module.
func (am AppModule) EndBlock(ctx context.Context) error {
	// Perform any end block logic like proof expiration
	return am.keeper.EndBlocker(ctx)
}

// GenerateGenesisState creates a randomized GenState of the zkproof module.
func (AppModule) GenerateGenesisState(simState *module.SimulationState) {
	// Will implement simulation logic if needed
}

// ProposalContents doesn't return any content functions for governance proposals.
func (AppModule) ProposalContents(simState module.SimulationState) []simtypes.WeightedProposalContent {
	return nil
}

// WeightedOperations returns the all the zkproof module operations with their respective weights.
func (am AppModule) WeightedOperations(simState module.SimulationState) []simtypes.WeightedOperation {
	return nil // Will implement simulation operations if needed
}

// App Wiring Setup

// ModuleInputs defines the inputs needed for the zkproof module.
type ModuleInputs struct {
	depinject.In

	Cdc          codec.Codec
	StoreService store.KVStoreService
	Logger       log.Logger
	Authority    string `optional:"true"`

	AccountKeeper types.AccountKeeper
	BankKeeper    types.BankKeeper
	DIDKeeper     types.DIDKeeper
}

// ModuleOutputs defines the outputs of the zkproof module.
type ModuleOutputs struct {
	depinject.Out

	ZKProofKeeper keeper.Keeper
	Module        appmodule.AppModule
}

// ProvideModule provides the zkproof module for dependency injection.
func ProvideModule(in ModuleInputs) ModuleOutputs {
	// Use provided authority or default to governance module address
	authority := in.Authority
	if authority == "" {
		// Default to governance module authority - will be provided by app wiring
		authority = authtypes.NewModuleAddress("gov").String()
	}

	k := keeper.NewKeeper(
		in.Cdc,
		in.StoreService,
		authority,
		in.AccountKeeper,
		in.BankKeeper,
		in.DIDKeeper,
	)

	m := NewAppModule(in.Cdc, *k)

	return ModuleOutputs{
		ZKProofKeeper: *k,
		Module:        m,
	}
}