package types

import (
	"context"

	"github.com/cosmos/cosmos-sdk/codec"
	cdctypes "github.com/cosmos/cosmos-sdk/codec/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// RegisterCodec registers the necessary x/did interfaces and concrete types
func RegisterCodec(cdc *codec.LegacyAmino) {
	cdc.RegisterConcrete(&MsgCreateDID{}, "personachain/MsgCreateDID", nil)
	cdc.RegisterConcrete(&MsgUpdateDID{}, "personachain/MsgUpdateDID", nil)
	cdc.RegisterConcrete(&MsgDeactivateDID{}, "personachain/MsgDeactivateDID", nil)
	cdc.RegisterConcrete(&MsgUpdateParams{}, "personachain/did/MsgUpdateParams", nil)
}

// RegisterInterfaces registers the x/did interfaces types with the interface registry
func RegisterInterfaces(registry cdctypes.InterfaceRegistry) {
	registry.RegisterImplementations((*sdk.Msg)(nil),
		&MsgCreateDID{},
		&MsgUpdateDID{},
		&MsgDeactivateDID{},
		&MsgUpdateParams{},
	)

	// Message service registration handled by generated proto code
}

var (
	Amino     = codec.NewLegacyAmino()
	ModuleCdc = codec.NewProtoCodec(cdctypes.NewInterfaceRegistry())
)

func init() {
	RegisterCodec(Amino)
	Amino.Seal()
}

// Simple message service descriptor for SDK compatibility
var MsgServiceDesc = struct {
	ServiceName string
	HandlerType interface{}
	Methods     []interface{}
}{
	ServiceName: "personahq.personachain.did.v1.Msg",
	HandlerType: (*MsgServer)(nil),
	Methods:     []interface{}{},
}

// MsgServer interface for message handling  
type MsgServer interface {
	CreateDID(ctx context.Context, req *MsgCreateDID) (*MsgCreateDIDResponse, error)
	UpdateDID(ctx context.Context, req *MsgUpdateDID) (*MsgUpdateDIDResponse, error)
	DeactivateDID(ctx context.Context, req *MsgDeactivateDID) (*MsgDeactivateDIDResponse, error)
	UpdateParams(ctx context.Context, req *MsgUpdateParams) (*MsgUpdateParamsResponse, error)
}

// RegisterMsgServer registers the message server
func RegisterMsgServer(server interface{}, impl MsgServer) {
	// For compatibility with SDK message server registration
	// In a full proto implementation, this would register with grpc
}