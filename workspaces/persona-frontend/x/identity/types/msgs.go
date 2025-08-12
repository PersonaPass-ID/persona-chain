package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
)

const (
	TypeMsgCreateIdentity   = "create_identity"
	TypeMsgIssueCredential  = "issue_credential"
	TypeMsgVerifyCredential = "verify_credential"
	TypeMsgRevokeCredential = "revoke_credential"
)

// MsgCreateIdentity - Create a new DID
type MsgCreateIdentity struct {
	Creator     string `json:"creator"`
	DIDDocument string `json:"did_document"`
}

// NewMsgCreateIdentity creates a new MsgCreateIdentity instance
func NewMsgCreateIdentity(creator string, didDocument string) *MsgCreateIdentity {
	return &MsgCreateIdentity{
		Creator:     creator,
		DIDDocument: didDocument,
	}
}

// Route implements sdk.Msg
func (msg *MsgCreateIdentity) Route() string {
	return RouterKey
}

// Type implements sdk.Msg
func (msg *MsgCreateIdentity) Type() string {
	return TypeMsgCreateIdentity
}

// GetSigners implements sdk.Msg
func (msg *MsgCreateIdentity) GetSigners() []sdk.AccAddress {
	creator, err := sdk.AccAddressFromBech32(msg.Creator)
	if err != nil {
		panic(err)
	}
	return []sdk.AccAddress{creator}
}

// GetSignBytes implements sdk.Msg
func (msg *MsgCreateIdentity) GetSignBytes() []byte {
	bz := ModuleCdc.MustMarshalJSON(msg)
	return sdk.MustSortJSON(bz)
}

// ValidateBasic implements sdk.Msg
func (msg *MsgCreateIdentity) ValidateBasic() error {
	_, err := sdk.AccAddressFromBech32(msg.Creator)
	if err != nil {
		return sdkerrors.Wrapf(sdkerrors.ErrInvalidAddress, "invalid creator address (%s)", err)
	}
	
	if len(msg.DIDDocument) == 0 {
		return sdkerrors.Wrap(sdkerrors.ErrInvalidRequest, "DID document cannot be empty")
	}
	
	if len(msg.DIDDocument) > 10000 {
		return sdkerrors.Wrap(sdkerrors.ErrInvalidRequest, "DID document too large (max 10KB)")
	}
	
	return nil
}

// MsgIssueCredential - Issue a verifiable credential
type MsgIssueCredential struct {
	Issuer         string `json:"issuer"`
	SubjectDID     string `json:"subject_did"`
	CredentialType string `json:"credential_type"`
	CredentialData string `json:"credential_data"`
	Expiry         int64  `json:"expiry"`
}

// NewMsgIssueCredential creates a new MsgIssueCredential instance
func NewMsgIssueCredential(issuer, subjectDID, credentialType, credentialData string, expiry int64) *MsgIssueCredential {
	return &MsgIssueCredential{
		Issuer:         issuer,
		SubjectDID:     subjectDID,
		CredentialType: credentialType,
		CredentialData: credentialData,
		Expiry:         expiry,
	}
}

// Route implements sdk.Msg
func (msg *MsgIssueCredential) Route() string {
	return RouterKey
}

// Type implements sdk.Msg
func (msg *MsgIssueCredential) Type() string {
	return TypeMsgIssueCredential
}

// GetSigners implements sdk.Msg
func (msg *MsgIssueCredential) GetSigners() []sdk.AccAddress {
	issuer, err := sdk.AccAddressFromBech32(msg.Issuer)
	if err != nil {
		panic(err)
	}
	return []sdk.AccAddress{issuer}
}

// GetSignBytes implements sdk.Msg
func (msg *MsgIssueCredential) GetSignBytes() []byte {
	bz := ModuleCdc.MustMarshalJSON(msg)
	return sdk.MustSortJSON(bz)
}

// ValidateBasic implements sdk.Msg
func (msg *MsgIssueCredential) ValidateBasic() error {
	_, err := sdk.AccAddressFromBech32(msg.Issuer)
	if err != nil {
		return sdkerrors.Wrapf(sdkerrors.ErrInvalidAddress, "invalid issuer address (%s)", err)
	}
	
	if len(msg.SubjectDID) == 0 {
		return sdkerrors.Wrap(sdkerrors.ErrInvalidRequest, "subject DID cannot be empty")
	}
	
	if len(msg.CredentialType) == 0 {
		return sdkerrors.Wrap(sdkerrors.ErrInvalidRequest, "credential type cannot be empty")
	}
	
	if len(msg.CredentialData) == 0 {
		return sdkerrors.Wrap(sdkerrors.ErrInvalidRequest, "credential data cannot be empty")
	}
	
	if len(msg.CredentialData) > 50000 {
		return sdkerrors.Wrap(sdkerrors.ErrInvalidRequest, "credential data too large (max 50KB)")
	}
	
	if msg.Expiry <= 0 {
		return sdkerrors.Wrap(sdkerrors.ErrInvalidRequest, "expiry must be positive")
	}
	
	return nil
}

// MsgVerifyCredential - Verify a credential with ZK proof
type MsgVerifyCredential struct {
	Verifier     string `json:"verifier"`
	CredentialID string `json:"credential_id"`
	ProofData    string `json:"proof_data"`
}

// NewMsgVerifyCredential creates a new MsgVerifyCredential instance
func NewMsgVerifyCredential(verifier, credentialID, proofData string) *MsgVerifyCredential {
	return &MsgVerifyCredential{
		Verifier:     verifier,
		CredentialID: credentialID,
		ProofData:    proofData,
	}
}

// Route implements sdk.Msg
func (msg *MsgVerifyCredential) Route() string {
	return RouterKey
}

// Type implements sdk.Msg
func (msg *MsgVerifyCredential) Type() string {
	return TypeMsgVerifyCredential
}

// GetSigners implements sdk.Msg
func (msg *MsgVerifyCredential) GetSigners() []sdk.AccAddress {
	verifier, err := sdk.AccAddressFromBech32(msg.Verifier)
	if err != nil {
		panic(err)
	}
	return []sdk.AccAddress{verifier}
}

// GetSignBytes implements sdk.Msg
func (msg *MsgVerifyCredential) GetSignBytes() []byte {
	bz := ModuleCdc.MustMarshalJSON(msg)
	return sdk.MustSortJSON(bz)
}

// ValidateBasic implements sdk.Msg
func (msg *MsgVerifyCredential) ValidateBasic() error {
	_, err := sdk.AccAddressFromBech32(msg.Verifier)
	if err != nil {
		return sdkerrors.Wrapf(sdkerrors.ErrInvalidAddress, "invalid verifier address (%s)", err)
	}
	
	if len(msg.CredentialID) == 0 {
		return sdkerrors.Wrap(sdkerrors.ErrInvalidRequest, "credential ID cannot be empty")
	}
	
	if len(msg.ProofData) == 0 {
		return sdkerrors.Wrap(sdkerrors.ErrInvalidRequest, "proof data cannot be empty")
	}
	
	return nil
}

// MsgRevokeCredential - Revoke an issued credential
type MsgRevokeCredential struct {
	Issuer       string `json:"issuer"`
	CredentialID string `json:"credential_id"`
	Reason       string `json:"reason"`
}

// NewMsgRevokeCredential creates a new MsgRevokeCredential instance
func NewMsgRevokeCredential(issuer, credentialID, reason string) *MsgRevokeCredential {
	return &MsgRevokeCredential{
		Issuer:       issuer,
		CredentialID: credentialID,
		Reason:       reason,
	}
}

// Route implements sdk.Msg
func (msg *MsgRevokeCredential) Route() string {
	return RouterKey
}

// Type implements sdk.Msg
func (msg *MsgRevokeCredential) Type() string {
	return TypeMsgRevokeCredential
}

// GetSigners implements sdk.Msg
func (msg *MsgRevokeCredential) GetSigners() []sdk.AccAddress {
	issuer, err := sdk.AccAddressFromBech32(msg.Issuer)
	if err != nil {
		panic(err)
	}
	return []sdk.AccAddress{issuer}
}

// GetSignBytes implements sdk.Msg
func (msg *MsgRevokeCredential) GetSignBytes() []byte {
	bz := ModuleCdc.MustMarshalJSON(msg)
	return sdk.MustSortJSON(bz)
}

// ValidateBasic implements sdk.Msg
func (msg *MsgRevokeCredential) ValidateBasic() error {
	_, err := sdk.AccAddressFromBech32(msg.Issuer)
	if err != nil {
		return sdkerrors.Wrapf(sdkerrors.ErrInvalidAddress, "invalid issuer address (%s)", err)
	}
	
	if len(msg.CredentialID) == 0 {
		return sdkerrors.Wrap(sdkerrors.ErrInvalidRequest, "credential ID cannot be empty")
	}
	
	if len(msg.Reason) == 0 {
		return sdkerrors.Wrap(sdkerrors.ErrInvalidRequest, "revocation reason cannot be empty")
	}
	
	return nil
}