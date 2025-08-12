package oracle

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

	"github.com/PersonaPass-ID/personachain/x/oracle/keeper"
	oraclekeeper "github.com/PersonaPass-ID/personachain/x/oracle/keeper"
	"github.com/PersonaPass-ID/personachain/x/oracle/types"
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
	keeper oraclekeeper.Keeper
}

func NewAppModule(cdc codec.Codec, keeper oraclekeeper.Keeper) AppModule {
	return AppModule{
		AppModuleBasic: NewAppModuleBasic(cdc),
		keeper:         keeper,
	}
}

func (am AppModule) RegisterServices(cfg module.Configurator) {}
func (am AppModule) RegisterInvariants(ir sdk.InvariantRegistry) {}

func (am AppModule) InitGenesis(ctx sdk.Context, cdc codec.JSONCodec, gs json.RawMessage) []abci.ValidatorUpdate {
	return []abci.ValidatorUpdate{}
}

func (am AppModule) ExportGenesis(ctx sdk.Context, cdc codec.JSONCodec) json.RawMessage {
	return cdc.MustMarshalJSON(DefaultGenesisState())
}

func (AppModule) ConsensusVersion() uint64 { return 1 }
func (am AppModule) BeginBlock(ctx context.Context) error { return nil }
func (am AppModule) EndBlock(ctx context.Context) error { return nil }
func (am AppModule) IsOnePerModuleType() {}
func (am AppModule) IsAppModule() {}

type GenesisState struct {
	Oracles []types.Oracle `json:"oracles"`
}

func DefaultGenesisState() *GenesisState {
	return &GenesisState{Oracles: []types.Oracle{}}
}

func (gs GenesisState) Validate() error {
	for _, oracle := range gs.Oracles {
		if err := oracle.Validate(); err != nil {
			return err
		}
	}
	return nil
}

// Implement proto.Message interface for SDK compatibility
func (m *GenesisState) ProtoMessage()  {}
func (m *GenesisState) Reset()         { *m = GenesisState{} }
func (m *GenesisState) String() string { return fmt.Sprintf("%+v", *m) }