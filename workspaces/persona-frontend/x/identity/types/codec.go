package types

import (
	"github.com/cosmos/cosmos-sdk/codec"
	cdctypes "github.com/cosmos/cosmos-sdk/codec/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/msgservice"
)

// RegisterCodec registers the necessary x/identity interfaces and concrete types
// on the provided LegacyAmino codec. These types are used for Amino JSON serialization.
func RegisterCodec(cdc *codec.LegacyAmino) {
	cdc.RegisterConcrete(&MsgCreateIdentity{}, "identity/CreateIdentity", nil)
	cdc.RegisterConcrete(&MsgIssueCredential{}, "identity/IssueCredential", nil)
	cdc.RegisterConcrete(&MsgVerifyCredential{}, "identity/VerifyCredential", nil)
	cdc.RegisterConcrete(&MsgRevokeCredential{}, "identity/RevokeCredential", nil)
}

// RegisterInterfaces registers the x/identity interfaces types with the interface registry
func RegisterInterfaces(registry cdctypes.InterfaceRegistry) {
	registry.RegisterImplementations((*sdk.Msg)(nil),
		&MsgCreateIdentity{},
		&MsgIssueCredential{},
		&MsgVerifyCredential{},
		&MsgRevokeCredential{},
	)

	msgservice.RegisterMsgServiceDesc(registry, &_Msg_serviceDesc)
}

var (
	// ModuleCdc references the global x/identity module codec. Note, the codec should
	// ONLY be used in certain instances of tests and for JSON encoding as Amino is
	// still used for that purpose.
	ModuleCdc = codec.NewProtoCodec(cdctypes.NewInterfaceRegistry())
)