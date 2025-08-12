package token

import (
	"context"
	"encoding/json"
	"fmt"

	abci "github.com/cometbft/cometbft/abci/types"
	"github.com/grpc-ecosystem/grpc-gateway/runtime"
	"github.com/spf13/cobra"

	"cosmossdk.io/core/appmodule"
	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/codec"
	codectypes "github.com/cosmos/cosmos-sdk/codec/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/module"

	"github.com/PersonaPass-ID/personachain/x/token/keeper"
	"github.com/PersonaPass-ID/personachain/x/token/types"
)

var (
	_ module.AppModule      = AppModule{}
	_ module.AppModuleBasic = AppModuleBasic{}
	_ appmodule.AppModule   = AppModule{}
)

type AppModuleBasic struct {
	cdc codec.BinaryCodec
}

func NewAppModuleBasic(cdc codec.BinaryCodec) AppModuleBasic {
	return AppModuleBasic{cdc: cdc}
}

func (AppModuleBasic) Name() string {
	return types.ModuleName
}

func (AppModuleBasic) RegisterLegacyAminoCodec(cdc *codec.LegacyAmino) {}
func (a AppModuleBasic) RegisterInterfaces(reg codectypes.InterfaceRegistry) {}

func (AppModuleBasic) DefaultGenesis(cdc codec.JSONCodec) json.RawMessage {
	return cdc.MustMarshalJSON(DefaultGenesisState())
}

func (AppModuleBasic) ValidateGenesis(cdc codec.JSONCodec, config client.TxEncodingConfig, bz json.RawMessage) error {
	var genState GenesisState
	if err := cdc.UnmarshalJSON(bz, &genState); err != nil {
		return fmt.Errorf("failed to unmarshal %s genesis state: %w", types.ModuleName, err)
	}
	return genState.Validate()
}

func (AppModuleBasic) RegisterGRPCGatewayRoutes(clientCtx client.Context, mux *runtime.ServeMux) {}
func (a AppModuleBasic) GetTxCmd() *cobra.Command { return nil }
func (AppModuleBasic) GetQueryCmd() *cobra.Command { return nil }

type AppModule struct {
	AppModuleBasic
	keeper *keeper.Keeper
}

func NewAppModule(cdc codec.Codec, keeper *keeper.Keeper) AppModule {
	return AppModule{
		AppModuleBasic: NewAppModuleBasic(cdc),
		keeper:         keeper,
	}
}

func (am AppModule) RegisterServices(cfg module.Configurator) {}
func (am AppModule) RegisterInvariants(ir sdk.InvariantRegistry) {}

func (am AppModule) InitGenesis(ctx sdk.Context, cdc codec.JSONCodec, gs json.RawMessage) []abci.ValidatorUpdate {
	var genState GenesisState
	cdc.MustUnmarshalJSON(gs, &genState)
	
	// Initialize token configuration
	if err := am.keeper.SetPersonaToken(ctx, genState.PersonaToken); err != nil {
		panic(err)
	}
	
	// Initialize parameters
	if err := am.keeper.SetParams(ctx, genState.Params); err != nil {
		panic(err)
	}
	
	return []abci.ValidatorUpdate{}
}

func (am AppModule) ExportGenesis(ctx sdk.Context, cdc codec.JSONCodec) json.RawMessage {
	genState := DefaultGenesisState()
	
	// Export token configuration
	token, err := am.keeper.GetPersonaToken(ctx)
	if err != nil {
		panic(err)
	}
	genState.PersonaToken = token
	
	// Export parameters
	params, err := am.keeper.GetParams(ctx)
	if err != nil {
		panic(err)
	}
	genState.Params = params
	
	return cdc.MustMarshalJSON(genState)
}

func (AppModule) ConsensusVersion() uint64 { return 1 }
func (am AppModule) BeginBlock(ctx context.Context) error { return nil }
func (am AppModule) EndBlock(ctx context.Context) error { return nil }
func (am AppModule) IsOnePerModuleType() {}
func (am AppModule) IsAppModule() {}

// GenesisState defines the token module's genesis state
type GenesisState struct {
	PersonaToken types.PersonaToken `json:"persona_token"`
	Params       types.TokenParams  `json:"params"`
}

// DefaultGenesisState returns the default genesis state
func DefaultGenesisState() *GenesisState {
	return &GenesisState{
		PersonaToken: types.DefaultPersonaToken(),
		Params:       types.DefaultParams(),
	}
}

// ValidateGenesis validates the genesis state
func (gs GenesisState) Validate() error {
	if err := gs.PersonaToken.Validate(); err != nil {
		return fmt.Errorf("invalid persona token: %w", err)
	}
	
	if err := gs.Params.Validate(); err != nil {
		return fmt.Errorf("invalid params: %w", err)
	}
	
	return nil
}

// Proto message implementations for GenesisState
func (m *GenesisState) ProtoMessage()  {}
func (m *GenesisState) Reset()         { *m = GenesisState{} }
func (m *GenesisState) String() string { return fmt.Sprintf("TokenGenesisState{%+v}", *m) }