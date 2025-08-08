package types

import (
	"time"

	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/gogoproto/proto"
)

var (
	_ sdk.Msg = &MsgCreateCredential{}
	_ sdk.Msg = &MsgRevokeCredential{}
	_ sdk.Msg = &MsgCreatePresentation{}
)

// Message type constants
const (
	TypeMsgCreateCredential    = "create_credential"
	TypeMsgRevokeCredential    = "revoke_credential"
	TypeMsgCreatePresentation  = "create_presentation"
)

// MsgCreateCredential defines the message to create a verifiable credential
type MsgCreateCredential struct {
	// Context is the JSON-LD context
	Context []string `json:"context"`
	// ID is the credential identifier
	Id string `json:"id"`
	// CredentialType specifies the credential type
	CredentialType []string `json:"type"`
	// Issuer is the credential issuer (DID)
	Issuer string `json:"issuer"`
	// ExpirationDate when the credential expires (optional)
	ExpirationDate *time.Time `json:"expirationDate,omitempty"`
	// CredentialSubject contains the claims
	CredentialSubject *CredentialSubject `json:"credentialSubject"`
	// Proof contains the cryptographic proof
	Proof *Proof `json:"proof,omitempty"`
	// Status information for revocation
	CredentialStatus *CredentialStatus `json:"credentialStatus,omitempty"`
}

// GetSigners returns the expected signers for MsgCreateCredential
func (msg *MsgCreateCredential) GetSigners() []sdk.AccAddress {
	issuer, err := sdk.AccAddressFromBech32(msg.Issuer)
	if err != nil {
		panic(err)
	}
	return []sdk.AccAddress{issuer}
}

// ValidateBasic validates the MsgCreateCredential
func (msg *MsgCreateCredential) ValidateBasic() error {
	if msg.Id == "" {
		return ErrInvalidCredential.Wrap("credential ID cannot be empty")
	}
	if msg.Issuer == "" {
		return ErrInvalidIssuer.Wrap("issuer cannot be empty")
	}
	if _, err := sdk.AccAddressFromBech32(msg.Issuer); err != nil {
		return ErrInvalidIssuer.Wrap("invalid issuer address")
	}
	if len(msg.CredentialType) == 0 {
		return ErrInvalidCredential.Wrap("credential type cannot be empty")
	}
	if len(msg.Context) == 0 {
		return ErrInvalidCredential.Wrap("credential context cannot be empty")
	}
	if msg.CredentialSubject == nil {
		return ErrInvalidCredential.Wrap("credential subject cannot be nil")
	}
	if msg.CredentialSubject.ID == "" {
		return ErrInvalidCredential.Wrap("credential subject ID cannot be empty")
	}
	return nil
}

// Type returns the message type
func (msg *MsgCreateCredential) Type() string { return TypeMsgCreateCredential }

// Route returns the message route
func (msg *MsgCreateCredential) Route() string { return RouterKey }

// GetSignBytes returns the message bytes to sign over
func (msg *MsgCreateCredential) GetSignBytes() []byte {
	bz := ModuleCdc.MustMarshalJSON(msg)
	return sdk.MustSortJSON(bz)
}

// Implement proto.Message interface
func (m *MsgCreateCredential) ProtoMessage()  {}
func (m *MsgCreateCredential) Reset()         { *m = MsgCreateCredential{} }
func (m *MsgCreateCredential) String() string { return proto.CompactTextString(m) }

// MsgCreateCredentialResponse defines the response for MsgCreateCredential
type MsgCreateCredentialResponse struct {
	CredentialId string `json:"credentialId"`
}

// Implement proto.Message interface
func (m *MsgCreateCredentialResponse) ProtoMessage()  {}
func (m *MsgCreateCredentialResponse) Reset()         { *m = MsgCreateCredentialResponse{} }
func (m *MsgCreateCredentialResponse) String() string { return proto.CompactTextString(m) }

// MsgRevokeCredential defines the message to revoke a verifiable credential
type MsgRevokeCredential struct {
	CredentialId string `json:"credentialId"`
	Revoker      string `json:"revoker"`
}

// GetSigners returns the expected signers for MsgRevokeCredential
func (msg *MsgRevokeCredential) GetSigners() []sdk.AccAddress {
	revoker, err := sdk.AccAddressFromBech32(msg.Revoker)
	if err != nil {
		panic(err)
	}
	return []sdk.AccAddress{revoker}
}

// ValidateBasic validates the MsgRevokeCredential
func (msg *MsgRevokeCredential) ValidateBasic() error {
	if msg.CredentialId == "" {
		return ErrInvalidCredential.Wrap("credential ID cannot be empty")
	}
	if msg.Revoker == "" {
		return ErrInvalidController.Wrap("revoker cannot be empty")
	}
	if _, err := sdk.AccAddressFromBech32(msg.Revoker); err != nil {
		return ErrInvalidController.Wrap("invalid revoker address")
	}
	return nil
}

// Type returns the message type
func (msg *MsgRevokeCredential) Type() string { return TypeMsgRevokeCredential }

// Route returns the message route
func (msg *MsgRevokeCredential) Route() string { return RouterKey }

// GetSignBytes returns the message bytes to sign over
func (msg *MsgRevokeCredential) GetSignBytes() []byte {
	bz := ModuleCdc.MustMarshalJSON(msg)
	return sdk.MustSortJSON(bz)
}

// Implement proto.Message interface
func (m *MsgRevokeCredential) ProtoMessage()  {}
func (m *MsgRevokeCredential) Reset()         { *m = MsgRevokeCredential{} }
func (m *MsgRevokeCredential) String() string { return proto.CompactTextString(m) }

// MsgRevokeCredentialResponse defines the response for MsgRevokeCredential
type MsgRevokeCredentialResponse struct{}

// Implement proto.Message interface
func (m *MsgRevokeCredentialResponse) ProtoMessage()  {}
func (m *MsgRevokeCredentialResponse) Reset()         { *m = MsgRevokeCredentialResponse{} }
func (m *MsgRevokeCredentialResponse) String() string { return proto.CompactTextString(m) }

// MsgCreatePresentation defines the message to create a verifiable presentation
type MsgCreatePresentation struct {
	// Context is the JSON-LD context
	Context []string `json:"context"`
	// ID is the presentation identifier
	Id string `json:"id"`
	// PresentationType specifies the presentation type
	PresentationType []string `json:"type"`
	// Holder is the entity that presents the credentials
	Holder string `json:"holder"`
	// VerifiableCredential contains the presented credentials
	VerifiableCredential []string `json:"verifiableCredential"`
	// Proof contains the cryptographic proof
	Proof *Proof `json:"proof,omitempty"`
}

// GetSigners returns the expected signers for MsgCreatePresentation
func (msg *MsgCreatePresentation) GetSigners() []sdk.AccAddress {
	holder, err := sdk.AccAddressFromBech32(msg.Holder)
	if err != nil {
		panic(err)
	}
	return []sdk.AccAddress{holder}
}

// ValidateBasic validates the MsgCreatePresentation
func (msg *MsgCreatePresentation) ValidateBasic() error {
	if msg.Id == "" {
		return ErrInvalidPresentation.Wrap("presentation ID cannot be empty")
	}
	if msg.Holder == "" {
		return ErrInvalidHolder.Wrap("holder cannot be empty")
	}
	if _, err := sdk.AccAddressFromBech32(msg.Holder); err != nil {
		return ErrInvalidHolder.Wrap("invalid holder address")
	}
	if len(msg.PresentationType) == 0 {
		return ErrInvalidPresentation.Wrap("presentation type cannot be empty")
	}
	if len(msg.Context) == 0 {
		return ErrInvalidPresentation.Wrap("presentation context cannot be empty")
	}
	if len(msg.VerifiableCredential) == 0 {
		return ErrInvalidPresentation.Wrap("presentation must contain at least one credential")
	}
	return nil
}

// Type returns the message type
func (msg *MsgCreatePresentation) Type() string { return TypeMsgCreatePresentation }

// Route returns the message route
func (msg *MsgCreatePresentation) Route() string { return RouterKey }

// GetSignBytes returns the message bytes to sign over
func (msg *MsgCreatePresentation) GetSignBytes() []byte {
	bz := ModuleCdc.MustMarshalJSON(msg)
	return sdk.MustSortJSON(bz)
}

// Implement proto.Message interface
func (m *MsgCreatePresentation) ProtoMessage()  {}
func (m *MsgCreatePresentation) Reset()         { *m = MsgCreatePresentation{} }
func (m *MsgCreatePresentation) String() string { return proto.CompactTextString(m) }

// MsgCreatePresentationResponse defines the response for MsgCreatePresentation
type MsgCreatePresentationResponse struct {
	PresentationId string `json:"presentationId"`
}

// Implement proto.Message interface
func (m *MsgCreatePresentationResponse) ProtoMessage()  {}
func (m *MsgCreatePresentationResponse) Reset()         { *m = MsgCreatePresentationResponse{} }
func (m *MsgCreatePresentationResponse) String() string { return proto.CompactTextString(m) }