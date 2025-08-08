package did

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/grpc-ecosystem/grpc-gateway/runtime"
	"github.com/spf13/cobra"

	"cosmossdk.io/core/appmodule"
	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/codec"
	codectypes "github.com/cosmos/cosmos-sdk/codec/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/module"
	simtypes "github.com/cosmos/cosmos-sdk/types/simulation"

	"github.com/personahq/personachain/x/did/keeper"
	"github.com/personahq/personachain/x/did/types"
)

// Type check to ensure the interface is properly implemented
var (
	_ module.AppModule           = AppModule{}
	_ module.AppModuleBasic      = AppModuleBasic{}
	_ module.AppModuleSimulation = AppModule{}
	_ appmodule.AppModule        = AppModule{}
)

// AppModuleBasic defines the basic application module used by the DID module
type AppModuleBasic struct {
	cdc codec.BinaryCodec
}

// Name returns the DID module's name
func (AppModuleBasic) Name() string {
	return types.ModuleName
}

// RegisterCodec registers the DID module's types on the given LegacyAmino codec
func (AppModuleBasic) RegisterLegacyAminoCodec(cdc *codec.LegacyAmino) {
	types.RegisterCodec(cdc)
}

// RegisterInterfaces registers the DID module's interface types
func (AppModuleBasic) RegisterInterfaces(reg codectypes.InterfaceRegistry) {
	types.RegisterInterfaces(reg)
}

// DefaultGenesis returns default genesis state as raw bytes for the DID module
func (AppModuleBasic) DefaultGenesis(cdc codec.JSONCodec) json.RawMessage {
	return cdc.MustMarshalJSON(types.DefaultGenesis())
}

// ValidateGenesis performs genesis state validation for the DID module
func (AppModuleBasic) ValidateGenesis(cdc codec.JSONCodec, config client.TxEncodingConfig, bz json.RawMessage) error {
	var genState types.GenesisState
	if err := cdc.UnmarshalJSON(bz, &genState); err != nil {
		return fmt.Errorf("failed to unmarshal %s genesis state: %w", types.ModuleName, err)
	}
	return genState.Validate()
}

// RegisterGRPCGatewayRoutes registers the gRPC Gateway routes for the DID module
func (AppModuleBasic) RegisterGRPCGatewayRoutes(clientCtx client.Context, mux *runtime.ServeMux) {
	// Register query routes - for now we'll skip this as it requires proto generated files
}

// GetTxCmd returns the root tx command for the DID module
func (AppModuleBasic) GetTxCmd() *cobra.Command {
	// Return empty command for now - will be implemented with CLI commands
	return &cobra.Command{
		Use:   types.ModuleName,
		Short: fmt.Sprintf("%s transactions subcommands", types.ModuleName),
	}
}

// GetQueryCmd returns no root query command for the DID module
func (AppModuleBasic) GetQueryCmd() *cobra.Command {
	// Return empty command for now - will be implemented with CLI commands
	return &cobra.Command{
		Use:   types.ModuleName,
		Short: fmt.Sprintf("Querying commands for the %s module", types.ModuleName),
	}
}

// AppModule implements an application module for the DID module
type AppModule struct {
	AppModuleBasic

	keeper keeper.Keeper
}

// NewAppModule creates a new AppModule object
func NewAppModule(cdc codec.Codec, keeper keeper.Keeper) AppModule {
	return AppModule{
		AppModuleBasic: AppModuleBasic{cdc: cdc},
		keeper:         keeper,
	}
}

// IsOnePerModuleType implements the depinject.OnePerModuleType interface
func (am AppModule) IsOnePerModuleType() {}

// IsAppModule implements the appmodule.AppModule interface
func (am AppModule) IsAppModule() {}

// Name returns the DID module's name
func (am AppModule) Name() string {
	return am.AppModuleBasic.Name()
}

// RegisterServices registers module services
func (am AppModule) RegisterServices(cfg module.Configurator) {
	// Register message server - using keeper directly as it implements the interface
	types.RegisterMsgServer(cfg.MsgServer(), &am.keeper)
}

// RegisterInvariants registers the DID module invariants
func (am AppModule) RegisterInvariants(_ sdk.InvariantRegistry) {}

// InitGenesis performs genesis initialization for the DID module
func (am AppModule) InitGenesis(ctx sdk.Context, cdc codec.JSONCodec, gs json.RawMessage) {
	var genState types.GenesisState
	cdc.MustUnmarshalJSON(gs, &genState)

	// Set parameters
	am.keeper.SetParams(ctx, genState.Params)

	// Set DID count
	am.keeper.SetDIDCount(ctx, genState.DIDCount)

	// Set DIDs
	for _, did := range genState.DIDs {
		store := ctx.KVStore(am.keeper.GetStoreKey())
		didKey := types.DIDKey(did.ID)
		didBz := am.keeper.GetCodec().MustMarshal(&did)
		store.Set(didKey, didBz)
		
		// Create controller index if we can determine the controller
		// For now, we'll skip this as we need more info about the controller
	}
}

// ExportGenesis returns the exported genesis state as raw bytes for the DID module
func (am AppModule) ExportGenesis(ctx sdk.Context, cdc codec.JSONCodec) json.RawMessage {
	genState := &types.GenesisState{
		Params:   am.keeper.GetParams(ctx),
		DIDs:     am.keeper.GetAllDIDs(ctx),
		DIDCount: am.keeper.GetDIDCount(ctx),
	}
	return cdc.MustMarshalJSON(genState)
}

// ConsensusVersion implements ConsensusVersion
func (AppModule) ConsensusVersion() uint64 { return 1 }

// BeginBlock executes all ABCI BeginBlock logic respective to the DID module
func (am AppModule) BeginBlock(ctx context.Context) error {
	return nil
}

// EndBlock executes all ABCI EndBlock logic respective to the DID module
func (am AppModule) EndBlock(ctx context.Context) error {
	return nil
}

// Simulation functions

// GenerateGenesisState creates a randomized GenState of the DID module
func (AppModule) GenerateGenesisState(simState *module.SimulationState) {}

// RegisterStoreDecoder registers a decoder for DID module's types
func (am AppModule) RegisterStoreDecoder(sdr simtypes.StoreDecoderRegistry) {}

// WeightedOperations returns the all the DID module operations with their respective weights
func (am AppModule) WeightedOperations(simState module.SimulationState) []simtypes.WeightedOperation {
	return nil
}