package types

import (
	"context"
	"time"

	errorsmod "cosmossdk.io/errors"
	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
	"github.com/cosmos/gogoproto/proto"
)

// Message types
const (
	TypeMsgCreateCircuit      = "create_circuit"
	TypeMsgSubmitProof       = "submit_proof"
	TypeMsgVerifyProof       = "verify_proof"
	TypeMsgCreateProofRequest = "create_proof_request"
	TypeMsgUpdateCircuit     = "update_circuit"
)

var (
	_ sdk.Msg = &MsgCreateCircuit{}
	_ sdk.Msg = &MsgSubmitProof{}
	_ sdk.Msg = &MsgVerifyProof{}
	_ sdk.Msg = &MsgCreateProofRequest{}
	_ sdk.Msg = &MsgUpdateCircuit{}
)

// MsgCreateCircuit creates a new zero-knowledge proof circuit.
type MsgCreateCircuit struct {
	Creator               string     `json:"creator"`
	Name                 string     `json:"name"`
	Description          string     `json:"description"`
	CircuitType          string     `json:"circuitType"`
	SupportedProofTypes  []string   `json:"supportedProofTypes"`
	CircuitData          []byte     `json:"circuitData"`
	Parameters           []byte     `json:"parameters"`
	PublicInputsSpec     []string   `json:"publicInputsSpec"`
	PrivateInputsSpec    []string   `json:"privateInputsSpec"`
	RequiresPublicInputs bool       `json:"requiresPublicInputs"`
	MaxProofSize         uint64     `json:"maxProofSize"`
	NumConstraints       uint64     `json:"numConstraints"`
	NumVariables         uint64     `json:"numVariables"`
	NumPublicInputs      uint64     `json:"numPublicInputs"`
	VerificationMethod   string     `json:"verificationMethod"`
	TrustedSetup         bool       `json:"trustedSetup"`
}

// NewMsgCreateCircuit creates a new MsgCreateCircuit instance.
func NewMsgCreateCircuit(
	creator, name, description, circuitType string,
	supportedProofTypes []string,
	circuitData, parameters []byte,
	publicInputsSpec, privateInputsSpec []string,
	requiresPublicInputs bool,
	maxProofSize, numConstraints, numVariables, numPublicInputs uint64,
	verificationMethod string,
	trustedSetup bool,
) *MsgCreateCircuit {
	return &MsgCreateCircuit{
		Creator:               creator,
		Name:                 name,
		Description:          description,
		CircuitType:          circuitType,
		SupportedProofTypes:  supportedProofTypes,
		CircuitData:          circuitData,
		Parameters:           parameters,
		PublicInputsSpec:     publicInputsSpec,
		PrivateInputsSpec:    privateInputsSpec,
		RequiresPublicInputs: requiresPublicInputs,
		MaxProofSize:         maxProofSize,
		NumConstraints:       numConstraints,
		NumVariables:         numVariables,
		NumPublicInputs:      numPublicInputs,
		VerificationMethod:   verificationMethod,
		TrustedSetup:         trustedSetup,
	}
}

// Route returns the message route.
func (msg *MsgCreateCircuit) Route() string { return RouterKey }

// Type returns the message type.
func (msg *MsgCreateCircuit) Type() string { return TypeMsgCreateCircuit }

// GetSigners returns the signers of the message.
func (msg *MsgCreateCircuit) GetSigners() []sdk.AccAddress {
	creator, err := sdk.AccAddressFromBech32(msg.Creator)
	if err != nil {
		panic(err)
	}
	return []sdk.AccAddress{creator}
}

// GetSignBytes returns the sign bytes for the message.
func (msg *MsgCreateCircuit) GetSignBytes() []byte {
	bz := ModuleCdc.MustMarshalJSON(msg)
	return sdk.MustSortJSON(bz)
}

// ValidateBasic performs basic message validation.
func (msg *MsgCreateCircuit) ValidateBasic() error {
	_, err := sdk.AccAddressFromBech32(msg.Creator)
	if err != nil {
		return errorsmod.Wrapf(sdkerrors.ErrInvalidAddress, "invalid creator address (%s)", err)
	}

	if msg.Name == "" {
		return errorsmod.Wrap(ErrInvalidCircuit, "circuit name cannot be empty")
	}

	if len(msg.CircuitData) == 0 {
		return errorsmod.Wrap(ErrInvalidCircuit, "circuit data cannot be empty")
	}

	if len(msg.SupportedProofTypes) == 0 {
		return errorsmod.Wrap(ErrInvalidCircuit, "must support at least one proof type")
	}

	return nil
}

// MsgSubmitProof submits a zero-knowledge proof for verification.
type MsgSubmitProof struct {
	Prover           string            `json:"prover"`
	Verifier         string            `json:"verifier,omitempty"`
	CircuitId        string            `json:"circuitId"`
	ProofType        string            `json:"proofType"`
	ProofData        []byte            `json:"proofData"`
	PublicInputs     []string          `json:"publicInputs"`
	VerificationData []byte            `json:"verificationData"`
	Description      string            `json:"description,omitempty"`
	Tags             []string          `json:"tags,omitempty"`
	Metadata         map[string]string `json:"metadata,omitempty"`
	ProofFee         sdk.Coins         `json:"proofFee"`
}

// NewMsgSubmitProof creates a new MsgSubmitProof instance.
func NewMsgSubmitProof(
	prover, verifier, circuitId, proofType string,
	proofData, verificationData []byte,
	publicInputs []string,
	description string,
	tags []string,
	metadata map[string]string,
	proofFee sdk.Coins,
) *MsgSubmitProof {
	return &MsgSubmitProof{
		Prover:           prover,
		Verifier:         verifier,
		CircuitId:        circuitId,
		ProofType:        proofType,
		ProofData:        proofData,
		PublicInputs:     publicInputs,
		VerificationData: verificationData,
		Description:      description,
		Tags:             tags,
		Metadata:         metadata,
		ProofFee:         proofFee,
	}
}

// Route returns the message route.
func (msg *MsgSubmitProof) Route() string { return RouterKey }

// Type returns the message type.
func (msg *MsgSubmitProof) Type() string { return TypeMsgSubmitProof }

// GetSigners returns the signers of the message.
func (msg *MsgSubmitProof) GetSigners() []sdk.AccAddress {
	prover, err := sdk.AccAddressFromBech32(msg.Prover)
	if err != nil {
		panic(err)
	}
	return []sdk.AccAddress{prover}
}

// GetSignBytes returns the sign bytes for the message.
func (msg *MsgSubmitProof) GetSignBytes() []byte {
	bz := ModuleCdc.MustMarshalJSON(msg)
	return sdk.MustSortJSON(bz)
}

// ValidateBasic performs basic message validation.
func (msg *MsgSubmitProof) ValidateBasic() error {
	_, err := sdk.AccAddressFromBech32(msg.Prover)
	if err != nil {
		return errorsmod.Wrapf(sdkerrors.ErrInvalidAddress, "invalid prover address (%s)", err)
	}

	if msg.Verifier != "" {
		_, err := sdk.AccAddressFromBech32(msg.Verifier)
		if err != nil {
			return errorsmod.Wrapf(sdkerrors.ErrInvalidAddress, "invalid verifier address (%s)", err)
		}
	}

	if msg.CircuitId == "" {
		return errorsmod.Wrap(ErrInvalidCircuit, "circuit ID cannot be empty")
	}

	if msg.ProofType == "" {
		return errorsmod.Wrap(ErrInvalidProofType, "proof type cannot be empty")
	}

	if len(msg.ProofData) == 0 {
		return errorsmod.Wrap(ErrInvalidProof, "proof data cannot be empty")
	}

	return nil
}

// MsgVerifyProof verifies a submitted proof.
type MsgVerifyProof struct {
	Verifier string `json:"verifier"`
	ProofId  string `json:"proofId"`
}

// NewMsgVerifyProof creates a new MsgVerifyProof instance.
func NewMsgVerifyProof(verifier, proofId string) *MsgVerifyProof {
	return &MsgVerifyProof{
		Verifier: verifier,
		ProofId:  proofId,
	}
}

// Route returns the message route.
func (msg *MsgVerifyProof) Route() string { return RouterKey }

// Type returns the message type.
func (msg *MsgVerifyProof) Type() string { return TypeMsgVerifyProof }

// GetSigners returns the signers of the message.
func (msg *MsgVerifyProof) GetSigners() []sdk.AccAddress {
	verifier, err := sdk.AccAddressFromBech32(msg.Verifier)
	if err != nil {
		panic(err)
	}
	return []sdk.AccAddress{verifier}
}

// GetSignBytes returns the sign bytes for the message.
func (msg *MsgVerifyProof) GetSignBytes() []byte {
	bz := ModuleCdc.MustMarshalJSON(msg)
	return sdk.MustSortJSON(bz)
}

// ValidateBasic performs basic message validation.
func (msg *MsgVerifyProof) ValidateBasic() error {
	_, err := sdk.AccAddressFromBech32(msg.Verifier)
	if err != nil {
		return errorsmod.Wrapf(sdkerrors.ErrInvalidAddress, "invalid verifier address (%s)", err)
	}

	if msg.ProofId == "" {
		return errorsmod.Wrap(ErrInvalidProof, "proof ID cannot be empty")
	}

	return nil
}

// MsgCreateProofRequest creates a request for a zero-knowledge proof.
type MsgCreateProofRequest struct {
	Requester            string    `json:"requester"`
	TargetProver         string    `json:"targetProver"`
	CircuitId            string    `json:"circuitId"`
	RequiredProofType    string    `json:"requiredProofType"`
	Challenge            string    `json:"challenge"`
	RequiredPublicInputs []string  `json:"requiredPublicInputs"`
	Deadline             time.Time `json:"deadline"`
	Reward               sdk.Coins `json:"reward"`
}

// NewMsgCreateProofRequest creates a new MsgCreateProofRequest instance.
func NewMsgCreateProofRequest(
	requester, targetProver, circuitId, requiredProofType, challenge string,
	requiredPublicInputs []string,
	deadline time.Time,
	reward sdk.Coins,
) *MsgCreateProofRequest {
	return &MsgCreateProofRequest{
		Requester:            requester,
		TargetProver:         targetProver,
		CircuitId:            circuitId,
		RequiredProofType:    requiredProofType,
		Challenge:            challenge,
		RequiredPublicInputs: requiredPublicInputs,
		Deadline:             deadline,
		Reward:               reward,
	}
}

// Route returns the message route.
func (msg *MsgCreateProofRequest) Route() string { return RouterKey }

// Type returns the message type.
func (msg *MsgCreateProofRequest) Type() string { return TypeMsgCreateProofRequest }

// GetSigners returns the signers of the message.
func (msg *MsgCreateProofRequest) GetSigners() []sdk.AccAddress {
	requester, err := sdk.AccAddressFromBech32(msg.Requester)
	if err != nil {
		panic(err)
	}
	return []sdk.AccAddress{requester}
}

// GetSignBytes returns the sign bytes for the message.
func (msg *MsgCreateProofRequest) GetSignBytes() []byte {
	bz := ModuleCdc.MustMarshalJSON(msg)
	return sdk.MustSortJSON(bz)
}

// ValidateBasic performs basic message validation.
func (msg *MsgCreateProofRequest) ValidateBasic() error {
	_, err := sdk.AccAddressFromBech32(msg.Requester)
	if err != nil {
		return errorsmod.Wrapf(sdkerrors.ErrInvalidAddress, "invalid requester address (%s)", err)
	}

	_, err = sdk.AccAddressFromBech32(msg.TargetProver)
	if err != nil {
		return errorsmod.Wrapf(sdkerrors.ErrInvalidAddress, "invalid target prover address (%s)", err)
	}

	if msg.CircuitId == "" {
		return errorsmod.Wrap(ErrInvalidCircuit, "circuit ID cannot be empty")
	}

	if msg.RequiredProofType == "" {
		return errorsmod.Wrap(ErrInvalidProofType, "required proof type cannot be empty")
	}

	if msg.Deadline.Before(time.Now()) {
		return errorsmod.Wrap(ErrProofRequestExpired, "deadline cannot be in the past")
	}

	return nil
}

// MsgUpdateCircuit updates an existing circuit.
type MsgUpdateCircuit struct {
	Creator     string `json:"creator"`
	CircuitId   string `json:"circuitId"`
	Name        string `json:"name,omitempty"`
	Description string `json:"description,omitempty"`
	Active      *bool  `json:"active,omitempty"`
}

// NewMsgUpdateCircuit creates a new MsgUpdateCircuit instance.
func NewMsgUpdateCircuit(creator, circuitId, name, description string, active *bool) *MsgUpdateCircuit {
	return &MsgUpdateCircuit{
		Creator:     creator,
		CircuitId:   circuitId,
		Name:        name,
		Description: description,
		Active:      active,
	}
}

// Route returns the message route.
func (msg *MsgUpdateCircuit) Route() string { return RouterKey }

// Type returns the message type.
func (msg *MsgUpdateCircuit) Type() string { return TypeMsgUpdateCircuit }

// GetSigners returns the signers of the message.
func (msg *MsgUpdateCircuit) GetSigners() []sdk.AccAddress {
	creator, err := sdk.AccAddressFromBech32(msg.Creator)
	if err != nil {
		panic(err)
	}
	return []sdk.AccAddress{creator}
}

// GetSignBytes returns the sign bytes for the message.
func (msg *MsgUpdateCircuit) GetSignBytes() []byte {
	bz := ModuleCdc.MustMarshalJSON(msg)
	return sdk.MustSortJSON(bz)
}

// ValidateBasic performs basic message validation.
func (msg *MsgUpdateCircuit) ValidateBasic() error {
	_, err := sdk.AccAddressFromBech32(msg.Creator)
	if err != nil {
		return errorsmod.Wrapf(sdkerrors.ErrInvalidAddress, "invalid creator address (%s)", err)
	}

	if msg.CircuitId == "" {
		return errorsmod.Wrap(ErrInvalidCircuit, "circuit ID cannot be empty")
	}

	return nil
}

// Response types

// MsgCreateCircuitResponse is the response for MsgCreateCircuit.
type MsgCreateCircuitResponse struct {
	CircuitId string `json:"circuitId"`
}

// MsgSubmitProofResponse is the response for MsgSubmitProof.
type MsgSubmitProofResponse struct {
	ProofId string `json:"proofId"`
}

// MsgVerifyProofResponse is the response for MsgVerifyProof.
type MsgVerifyProofResponse struct {
	Status string `json:"status"`
	Valid  bool   `json:"valid"`
}

// MsgCreateProofRequestResponse is the response for MsgCreateProofRequest.
type MsgCreateProofRequestResponse struct {
	RequestId string `json:"requestId"`
}

// MsgUpdateCircuitResponse is the response for MsgUpdateCircuit.
type MsgUpdateCircuitResponse struct {
	Success bool `json:"success"`
}

// ProtoMessage methods for all message types

func (m *MsgCreateCircuit) ProtoMessage()     {}
func (m *MsgCreateCircuit) Reset()            { *m = MsgCreateCircuit{} }
func (m *MsgCreateCircuit) String() string    { return proto.CompactTextString(m) }

func (m *MsgSubmitProof) ProtoMessage()       {}
func (m *MsgSubmitProof) Reset()              { *m = MsgSubmitProof{} }
func (m *MsgSubmitProof) String() string      { return proto.CompactTextString(m) }

func (m *MsgVerifyProof) ProtoMessage()       {}
func (m *MsgVerifyProof) Reset()              { *m = MsgVerifyProof{} }
func (m *MsgVerifyProof) String() string      { return proto.CompactTextString(m) }

func (m *MsgCreateProofRequest) ProtoMessage() {}
func (m *MsgCreateProofRequest) Reset()        { *m = MsgCreateProofRequest{} }
func (m *MsgCreateProofRequest) String() string { return proto.CompactTextString(m) }

func (m *MsgUpdateCircuit) ProtoMessage()     {}
func (m *MsgUpdateCircuit) Reset()            { *m = MsgUpdateCircuit{} }
func (m *MsgUpdateCircuit) String() string    { return proto.CompactTextString(m) }

func (m *MsgCreateCircuitResponse) ProtoMessage()     {}
func (m *MsgCreateCircuitResponse) Reset()            { *m = MsgCreateCircuitResponse{} }
func (m *MsgCreateCircuitResponse) String() string    { return proto.CompactTextString(m) }

func (m *MsgSubmitProofResponse) ProtoMessage()       {}
func (m *MsgSubmitProofResponse) Reset()              { *m = MsgSubmitProofResponse{} }
func (m *MsgSubmitProofResponse) String() string      { return proto.CompactTextString(m) }

func (m *MsgVerifyProofResponse) ProtoMessage()       {}
func (m *MsgVerifyProofResponse) Reset()              { *m = MsgVerifyProofResponse{} }
func (m *MsgVerifyProofResponse) String() string      { return proto.CompactTextString(m) }

func (m *MsgCreateProofRequestResponse) ProtoMessage() {}
func (m *MsgCreateProofRequestResponse) Reset()        { *m = MsgCreateProofRequestResponse{} }
func (m *MsgCreateProofRequestResponse) String() string { return proto.CompactTextString(m) }

func (m *MsgUpdateCircuitResponse) ProtoMessage()     {}
func (m *MsgUpdateCircuitResponse) Reset()            { *m = MsgUpdateCircuitResponse{} }
func (m *MsgUpdateCircuitResponse) String() string    { return proto.CompactTextString(m) }

// MsgServer is the server API for Msg service.
type MsgServer interface {
	// CreateCircuit creates a new zero-knowledge proof circuit
	CreateCircuit(ctx context.Context, req *MsgCreateCircuit) (*MsgCreateCircuitResponse, error)
	// SubmitProof submits a zero-knowledge proof for verification
	SubmitProof(ctx context.Context, req *MsgSubmitProof) (*MsgSubmitProofResponse, error)
	// VerifyProof verifies a submitted proof
	VerifyProof(ctx context.Context, req *MsgVerifyProof) (*MsgVerifyProofResponse, error)
	// CreateProofRequest creates a request for a zero-knowledge proof
	CreateProofRequest(ctx context.Context, req *MsgCreateProofRequest) (*MsgCreateProofRequestResponse, error)
	// UpdateCircuit updates an existing circuit
	UpdateCircuit(ctx context.Context, req *MsgUpdateCircuit) (*MsgUpdateCircuitResponse, error)
}