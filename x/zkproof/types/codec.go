package types

import (
	"github.com/cosmos/cosmos-sdk/codec"
	"github.com/cosmos/cosmos-sdk/codec/legacy"
	cdctypes "github.com/cosmos/cosmos-sdk/codec/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

const (
	// RouterKey is the message route for the zkproof module
	RouterKey = ModuleName
)

// RegisterCodec registers the zkproof module's types on the given LegacyAmino codec.
func RegisterCodec(cdc *codec.LegacyAmino) {
	cdc.RegisterConcrete(&MsgCreateCircuit{}, "zkproof/CreateCircuit", nil)
	cdc.RegisterConcrete(&MsgSubmitProof{}, "zkproof/SubmitProof", nil)
	cdc.RegisterConcrete(&MsgVerifyProof{}, "zkproof/VerifyProof", nil)
	cdc.RegisterConcrete(&MsgCreateProofRequest{}, "zkproof/CreateProofRequest", nil)
	cdc.RegisterConcrete(&MsgUpdateCircuit{}, "zkproof/UpdateCircuit", nil)
}

// RegisterInterfaces registers the zkproof module's interface types.
func RegisterInterfaces(registry cdctypes.InterfaceRegistry) {
	registry.RegisterImplementations((*sdk.Msg)(nil),
		&MsgCreateCircuit{},
		&MsgSubmitProof{},
		&MsgVerifyProof{},
		&MsgCreateProofRequest{},
		&MsgUpdateCircuit{},
	)

	// Message service registration handled by generated proto code
}

// ModuleCdc references the global zkproof module codec. Note, the codec should
// ONLY be used in certain instances of tests and for JSON encoding as Amino is
// still used for that purpose.
var (
	amino     = codec.NewLegacyAmino()
	ModuleCdc = codec.NewAminoCodec(amino)
)

func init() {
	RegisterCodec(amino)
	sdk.RegisterLegacyAminoCodec(amino)

	// Register all Amino interfaces and concrete types on the authz Amino codec so that this can later be
	// used to properly serialize MsgGrant and MsgExec instances
	RegisterCodec(legacy.Cdc)
}

// RegisterMsgServer registers the server implementation with the server configurator
func RegisterMsgServer(s cdctypes.InterfaceRegistry, srv MsgServer) {
	// This will be implemented when we have proper proto generation
	// For now, we'll use the manual implementation
}

// _Msg_serviceDesc is a service descriptor for the Msg service
var _Msg_serviceDesc = struct{}{}