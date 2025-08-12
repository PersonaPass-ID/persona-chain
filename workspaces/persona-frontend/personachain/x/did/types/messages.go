package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
	proto "github.com/cosmos/gogoproto/proto"
	"encoding/json"
)

const (
	TypeMsgCreateDID       = "create_did"
	TypeMsgUpdateDID       = "update_did"
	TypeMsgDeactivateDID   = "deactivate_did"
	TypeMsgUpdateParams    = "update_params"
	TypeMsgLinkAuthMethod  = "link_auth_method"
	TypeMsgUnlinkAuthMethod = "unlink_auth_method"
	TypeMsgUpdateAuthMethod = "update_auth_method"
)

var (
	_ sdk.Msg = &MsgCreateDID{}
	_ sdk.Msg = &MsgUpdateDID{}
	_ sdk.Msg = &MsgDeactivateDID{}
	_ sdk.Msg = &MsgUpdateParams{}
	_ sdk.Msg = &MsgLinkAuthMethod{}
	_ sdk.Msg = &MsgUnlinkAuthMethod{}
	_ sdk.Msg = &MsgUpdateAuthMethod{}
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

// MsgLinkAuthMethod defines the message for linking an authentication method to a DID
type MsgLinkAuthMethod struct {
	DID            string `json:"did"`
	MethodID       string `json:"method_id"`
	MethodType     string `json:"method_type"`     // "totp", "oauth_microsoft", etc.
	PublicKeyHash  string `json:"public_key_hash"` // SHA-256 hash of secret or OAuth attestation
	Attestation    string `json:"attestation"`     // Optional: signed attestation for OAuth
	IsPrimary      bool   `json:"is_primary"`      // Whether this is the primary auth method
	Signer         string `json:"signer"`          // Must be DID controller
}

func NewMsgLinkAuthMethod(did, methodID, methodType, publicKeyHash, attestation string, isPrimary bool, signer string) *MsgLinkAuthMethod {
	return &MsgLinkAuthMethod{
		DID:           did,
		MethodID:      methodID,
		MethodType:    methodType,
		PublicKeyHash: publicKeyHash,
		Attestation:   attestation,
		IsPrimary:     isPrimary,
		Signer:        signer,
	}
}

func (msg MsgLinkAuthMethod) Route() string { return RouterKey }
func (msg MsgLinkAuthMethod) Type() string  { return TypeMsgLinkAuthMethod }

func (msg MsgLinkAuthMethod) ValidateBasic() error {
	if msg.DID == "" {
		return ErrInvalidDID
	}
	if msg.MethodID == "" {
		return ErrInvalidMethodID
	}
	if msg.MethodType == "" {
		return ErrInvalidMethodType
	}
	if msg.PublicKeyHash == "" {
		return ErrInvalidPublicKeyHash
	}
	if msg.Signer == "" {
		return ErrInvalidController
	}
	return nil
}

func (msg MsgLinkAuthMethod) GetSigners() []sdk.AccAddress {
	addr, _ := sdk.AccAddressFromBech32(msg.Signer)
	return []sdk.AccAddress{addr}
}

func (msg MsgLinkAuthMethod) GetSignBytes() []byte {
	bz, _ := json.Marshal(msg)
	return sdk.MustSortJSON(bz)
}

func (m *MsgLinkAuthMethod) ProtoMessage()  {}
func (m *MsgLinkAuthMethod) Reset()         { *m = MsgLinkAuthMethod{} }
func (m *MsgLinkAuthMethod) String() string { return proto.CompactTextString(m) }
func (m *MsgLinkAuthMethod) XXX_MessageName() string { return "personahq.personachain.did.v1.MsgLinkAuthMethod" }

type MsgLinkAuthMethodResponse struct {
	MethodID string `json:"method_id"`
}

func (m *MsgLinkAuthMethodResponse) ProtoMessage()  {}
func (m *MsgLinkAuthMethodResponse) Reset()         { *m = MsgLinkAuthMethodResponse{} }
func (m *MsgLinkAuthMethodResponse) String() string { return proto.CompactTextString(m) }
func (m *MsgLinkAuthMethodResponse) XXX_MessageName() string { return "personahq.personachain.did.v1.MsgLinkAuthMethodResponse" }

// MsgUnlinkAuthMethod defines the message for unlinking an authentication method from a DID
type MsgUnlinkAuthMethod struct {
	DID      string `json:"did"`
	MethodID string `json:"method_id"`
	Signer   string `json:"signer"` // Must be DID controller
}

func NewMsgUnlinkAuthMethod(did, methodID, signer string) *MsgUnlinkAuthMethod {
	return &MsgUnlinkAuthMethod{
		DID:      did,
		MethodID: methodID,
		Signer:   signer,
	}
}

func (msg MsgUnlinkAuthMethod) Route() string { return RouterKey }
func (msg MsgUnlinkAuthMethod) Type() string  { return TypeMsgUnlinkAuthMethod }

func (msg MsgUnlinkAuthMethod) ValidateBasic() error {
	if msg.DID == "" {
		return ErrInvalidDID
	}
	if msg.MethodID == "" {
		return ErrInvalidMethodID
	}
	if msg.Signer == "" {
		return ErrInvalidController
	}
	return nil
}

func (msg MsgUnlinkAuthMethod) GetSigners() []sdk.AccAddress {
	addr, _ := sdk.AccAddressFromBech32(msg.Signer)
	return []sdk.AccAddress{addr}
}

func (msg MsgUnlinkAuthMethod) GetSignBytes() []byte {
	bz, _ := json.Marshal(msg)
	return sdk.MustSortJSON(bz)
}

func (m *MsgUnlinkAuthMethod) ProtoMessage()  {}
func (m *MsgUnlinkAuthMethod) Reset()         { *m = MsgUnlinkAuthMethod{} }
func (m *MsgUnlinkAuthMethod) String() string { return proto.CompactTextString(m) }
func (m *MsgUnlinkAuthMethod) XXX_MessageName() string { return "personahq.personachain.did.v1.MsgUnlinkAuthMethod" }

type MsgUnlinkAuthMethodResponse struct{}

func (m *MsgUnlinkAuthMethodResponse) ProtoMessage()  {}
func (m *MsgUnlinkAuthMethodResponse) Reset()         { *m = MsgUnlinkAuthMethodResponse{} }
func (m *MsgUnlinkAuthMethodResponse) String() string { return proto.CompactTextString(m) }
func (m *MsgUnlinkAuthMethodResponse) XXX_MessageName() string { return "personahq.personachain.did.v1.MsgUnlinkAuthMethodResponse" }

// MsgUpdateAuthMethod defines the message for updating an authentication method
type MsgUpdateAuthMethod struct {
	DID       string `json:"did"`
	MethodID  string `json:"method_id"`
	IsPrimary bool   `json:"is_primary"`
	IsActive  bool   `json:"is_active"`
	Signer    string `json:"signer"` // Must be DID controller
}

func NewMsgUpdateAuthMethod(did, methodID string, isPrimary, isActive bool, signer string) *MsgUpdateAuthMethod {
	return &MsgUpdateAuthMethod{
		DID:       did,
		MethodID:  methodID,
		IsPrimary: isPrimary,
		IsActive:  isActive,
		Signer:    signer,
	}
}

func (msg MsgUpdateAuthMethod) Route() string { return RouterKey }
func (msg MsgUpdateAuthMethod) Type() string  { return TypeMsgUpdateAuthMethod }

func (msg MsgUpdateAuthMethod) ValidateBasic() error {
	if msg.DID == "" {
		return ErrInvalidDID
	}
	if msg.MethodID == "" {
		return ErrInvalidMethodID
	}
	if msg.Signer == "" {
		return ErrInvalidController
	}
	return nil
}

func (msg MsgUpdateAuthMethod) GetSigners() []sdk.AccAddress {
	addr, _ := sdk.AccAddressFromBech32(msg.Signer)
	return []sdk.AccAddress{addr}
}

func (msg MsgUpdateAuthMethod) GetSignBytes() []byte {
	bz, _ := json.Marshal(msg)
	return sdk.MustSortJSON(bz)
}

func (m *MsgUpdateAuthMethod) ProtoMessage()  {}
func (m *MsgUpdateAuthMethod) Reset()         { *m = MsgUpdateAuthMethod{} }
func (m *MsgUpdateAuthMethod) String() string { return proto.CompactTextString(m) }
func (m *MsgUpdateAuthMethod) XXX_MessageName() string { return "personahq.personachain.did.v1.MsgUpdateAuthMethod" }

type MsgUpdateAuthMethodResponse struct{}

func (m *MsgUpdateAuthMethodResponse) ProtoMessage()  {}
func (m *MsgUpdateAuthMethodResponse) Reset()         { *m = MsgUpdateAuthMethodResponse{} }
func (m *MsgUpdateAuthMethodResponse) String() string { return proto.CompactTextString(m) }
func (m *MsgUpdateAuthMethodResponse) XXX_MessageName() string { return "personahq.personachain.did.v1.MsgUpdateAuthMethodResponse" }