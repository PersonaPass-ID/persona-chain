package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
	proto "github.com/cosmos/gogoproto/proto"
	"encoding/json"
)

const (
	TypeMsgCreateDID     = "create_did"
	TypeMsgUpdateDID     = "update_did"
	TypeMsgDeactivateDID = "deactivate_did"
	TypeMsgUpdateParams  = "update_params"
)

var (
	_ sdk.Msg = &MsgCreateDID{}
	_ sdk.Msg = &MsgUpdateDID{}
	_ sdk.Msg = &MsgDeactivateDID{}
	_ sdk.Msg = &MsgUpdateParams{}
)

// MsgCreateDID defines the message for creating a new DID
type MsgCreateDID struct {
	Controller  string      `json:"controller"`
	DIDDocument DIDDocument `json:"didDocument"`
}

// NewMsgCreateDID creates a new MsgCreateDID instance
func NewMsgCreateDID(controller string, didDocument DIDDocument) *MsgCreateDID {
	return &MsgCreateDID{
		Controller:  controller,
		DIDDocument: didDocument,
	}
}

// Route returns the module's message routing key
func (msg MsgCreateDID) Route() string { return RouterKey }

// Type returns the message type
func (msg MsgCreateDID) Type() string { return TypeMsgCreateDID }

// ValidateBasic validates basic fields of the message
func (msg MsgCreateDID) ValidateBasic() error {
	if msg.Controller == "" {
		return ErrInvalidController
	}
	if msg.DIDDocument.ID == "" {
		return ErrInvalidDID
	}
	return nil
}

// GetSigners returns the expected signers for the message
func (msg MsgCreateDID) GetSigners() []sdk.AccAddress {
	addr, _ := sdk.AccAddressFromBech32(msg.Controller)
	return []sdk.AccAddress{addr}
}

// GetSignBytes returns the message bytes to sign over
func (msg MsgCreateDID) GetSignBytes() []byte {
	bz, _ := json.Marshal(msg)
	return sdk.MustSortJSON(bz)
}

// Proto compatibility
func (m *MsgCreateDID) ProtoMessage()  {}
func (m *MsgCreateDID) Reset()         { *m = MsgCreateDID{} }
func (m *MsgCreateDID) String() string { return proto.CompactTextString(m) }
func (m *MsgCreateDID) XXX_MessageName() string { return "personahq.personachain.did.v1.MsgCreateDID" }

// MsgCreateDIDResponse defines the response for MsgCreateDID
type MsgCreateDIDResponse struct {
	ID string `json:"id"`
}

func (m *MsgCreateDIDResponse) ProtoMessage()  {}
func (m *MsgCreateDIDResponse) Reset()         { *m = MsgCreateDIDResponse{} }
func (m *MsgCreateDIDResponse) String() string { return proto.CompactTextString(m) }
func (m *MsgCreateDIDResponse) XXX_MessageName() string { return "personahq.personachain.did.v1.MsgCreateDIDResponse" }

// MsgUpdateDID defines the message for updating a DID
type MsgUpdateDID struct {
	Controller  string      `json:"controller"`
	ID          string      `json:"id"`
	DIDDocument DIDDocument `json:"didDocument"`
}

func NewMsgUpdateDID(controller, id string, didDocument DIDDocument) *MsgUpdateDID {
	return &MsgUpdateDID{
		Controller:  controller,
		ID:          id,
		DIDDocument: didDocument,
	}
}

func (msg MsgUpdateDID) Route() string { return RouterKey }
func (msg MsgUpdateDID) Type() string  { return TypeMsgUpdateDID }

func (msg MsgUpdateDID) ValidateBasic() error {
	if msg.Controller == "" {
		return ErrInvalidController
	}
	if msg.ID == "" {
		return ErrInvalidDID
	}
	return nil
}

func (msg MsgUpdateDID) GetSigners() []sdk.AccAddress {
	addr, _ := sdk.AccAddressFromBech32(msg.Controller)
	return []sdk.AccAddress{addr}
}

func (msg MsgUpdateDID) GetSignBytes() []byte {
	bz, _ := json.Marshal(msg)
	return sdk.MustSortJSON(bz)
}

func (m *MsgUpdateDID) ProtoMessage()  {}
func (m *MsgUpdateDID) Reset()         { *m = MsgUpdateDID{} }
func (m *MsgUpdateDID) String() string { return proto.CompactTextString(m) }
func (m *MsgUpdateDID) XXX_MessageName() string { return "personahq.personachain.did.v1.MsgUpdateDID" }

type MsgUpdateDIDResponse struct{}

func (m *MsgUpdateDIDResponse) ProtoMessage()  {}
func (m *MsgUpdateDIDResponse) Reset()         { *m = MsgUpdateDIDResponse{} }
func (m *MsgUpdateDIDResponse) String() string { return proto.CompactTextString(m) }
func (m *MsgUpdateDIDResponse) XXX_MessageName() string { return "personahq.personachain.did.v1.MsgUpdateDIDResponse" }

// MsgDeactivateDID defines the message for deactivating a DID
type MsgDeactivateDID struct {
	Controller string `json:"controller"`
	ID         string `json:"id"`
}

func NewMsgDeactivateDID(controller, id string) *MsgDeactivateDID {
	return &MsgDeactivateDID{
		Controller: controller,
		ID:         id,
	}
}

func (msg MsgDeactivateDID) Route() string { return RouterKey }
func (msg MsgDeactivateDID) Type() string  { return TypeMsgDeactivateDID }

func (msg MsgDeactivateDID) ValidateBasic() error {
	if msg.Controller == "" {
		return ErrInvalidController
	}
	if msg.ID == "" {
		return ErrInvalidDID
	}
	return nil
}

func (msg MsgDeactivateDID) GetSigners() []sdk.AccAddress {
	addr, _ := sdk.AccAddressFromBech32(msg.Controller)
	return []sdk.AccAddress{addr}
}

func (msg MsgDeactivateDID) GetSignBytes() []byte {
	bz, _ := json.Marshal(msg)
	return sdk.MustSortJSON(bz)
}

func (m *MsgDeactivateDID) ProtoMessage()  {}
func (m *MsgDeactivateDID) Reset()         { *m = MsgDeactivateDID{} }
func (m *MsgDeactivateDID) String() string { return proto.CompactTextString(m) }
func (m *MsgDeactivateDID) XXX_MessageName() string { return "personahq.personachain.did.v1.MsgDeactivateDID" }

type MsgDeactivateDIDResponse struct{}

func (m *MsgDeactivateDIDResponse) ProtoMessage()  {}
func (m *MsgDeactivateDIDResponse) Reset()         { *m = MsgDeactivateDIDResponse{} }
func (m *MsgDeactivateDIDResponse) String() string { return proto.CompactTextString(m) }
func (m *MsgDeactivateDIDResponse) XXX_MessageName() string { return "personahq.personachain.did.v1.MsgDeactivateDIDResponse" }

// MsgUpdateParams defines the message for updating parameters
type MsgUpdateParams struct {
	Authority string `json:"authority"`
	Params    Params `json:"params"`
}

func NewMsgUpdateParams(authority string, params Params) *MsgUpdateParams {
	return &MsgUpdateParams{
		Authority: authority,
		Params:    params,
	}
}

func (msg MsgUpdateParams) Route() string { return RouterKey }
func (msg MsgUpdateParams) Type() string  { return TypeMsgUpdateParams }

func (msg MsgUpdateParams) ValidateBasic() error {
	if msg.Authority == "" {
		return ErrInvalidAuthority
	}
	return nil
}

func (msg MsgUpdateParams) GetSigners() []sdk.AccAddress {
	addr, _ := sdk.AccAddressFromBech32(msg.Authority)
	return []sdk.AccAddress{addr}
}

func (msg MsgUpdateParams) GetSignBytes() []byte {
	bz, _ := json.Marshal(msg)
	return sdk.MustSortJSON(bz)
}

func (m *MsgUpdateParams) ProtoMessage()  {}
func (m *MsgUpdateParams) Reset()         { *m = MsgUpdateParams{} }
func (m *MsgUpdateParams) String() string { return proto.CompactTextString(m) }
func (m *MsgUpdateParams) XXX_MessageName() string { return "personahq.personachain.did.v1.MsgUpdateParams" }

type MsgUpdateParamsResponse struct{}

func (m *MsgUpdateParamsResponse) ProtoMessage()  {}
func (m *MsgUpdateParamsResponse) Reset()         { *m = MsgUpdateParamsResponse{} }
func (m *MsgUpdateParamsResponse) String() string { return proto.CompactTextString(m) }
func (m *MsgUpdateParamsResponse) XXX_MessageName() string { return "personahq.personachain.did.v1.MsgUpdateParamsResponse" }