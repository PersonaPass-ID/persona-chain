package keeper

import (
	"context"
	"fmt"
	"strconv"
	"time"

	errorsmod "cosmossdk.io/errors"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/PersonaPass-ID/personachain/x/zkproof/types"
)

type msgServer struct {
	Keeper
}

var _ types.MsgServer = msgServer{}

// NewMsgServerImpl returns an implementation of the MsgServer interface
// for the provided Keeper.
func NewMsgServerImpl(keeper Keeper) types.MsgServer {
	return &msgServer{Keeper: keeper}
}

// CreateCircuit creates a new zero-knowledge proof circuit.
func (k msgServer) CreateCircuit(goCtx context.Context, msg *types.MsgCreateCircuit) (*types.MsgCreateCircuitResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// Validate DID exists
	if err := k.didKeeper.ValidateDID(ctx, msg.Creator); err != nil {
		return nil, errorsmod.Wrapf(types.ErrInvalidProver, "invalid creator DID: %s", err)
	}

	// Get parameters
	params, err := k.GetParams(ctx)
	if err != nil {
		return nil, err
	}

	// Check circuit size limits
	if uint64(len(msg.CircuitData)) > params.MaxCircuitSize {
		return nil, errorsmod.Wrapf(types.ErrCircuitTooLarge, "circuit data size %d exceeds limit %d", len(msg.CircuitData), params.MaxCircuitSize)
	}

	// Check circuit type is allowed
	allowed := false
	for _, allowedType := range params.AllowedCircuitTypes {
		if allowedType == types.CircuitType(msg.CircuitType) {
			allowed = true
			break
		}
	}
	if !allowed {
		return nil, errorsmod.Wrapf(types.ErrInvalidCircuitType, "circuit type %s not allowed", msg.CircuitType)
	}

	// Get creator's address
	creatorAddr, err := sdk.AccAddressFromBech32(msg.Creator)
	if err != nil {
		return nil, errorsmod.Wrapf(types.ErrInvalidProver, "invalid creator address: %s", err)
	}

	// Charge circuit creation fee
	if !params.CircuitCreationFee.IsZero() {
		if err := k.bankKeeper.SendCoinsFromAccountToModule(ctx, creatorAddr, types.ModuleName, params.CircuitCreationFee); err != nil {
			return nil, errorsmod.Wrapf(types.ErrInsufficientFees, "failed to pay circuit creation fee: %s", err)
		}
	}

	// Generate circuit ID
	count, _ := k.CircuitCount.Get(ctx)
	circuitID := fmt.Sprintf("circuit-%d", count+1)

	// Parse supported proof types
	var supportedProofTypes []types.ProofType
	for _, pt := range msg.SupportedProofTypes {
		supportedProofTypes = append(supportedProofTypes, types.ProofType(pt))
	}

	// Create circuit
	circuit := types.Circuit{
		Id:                   circuitID,
		Name:                msg.Name,
		Description:         msg.Description,
		Creator:             msg.Creator,
		CircuitType:         types.CircuitType(msg.CircuitType),
		SupportedProofTypes: supportedProofTypes,
		CircuitData:         msg.CircuitData,
		Parameters:          msg.Parameters,
		PublicInputsSpec:    msg.PublicInputsSpec,
		PrivateInputsSpec:   msg.PrivateInputsSpec,
		RequiresPublicInputs: msg.RequiresPublicInputs,
		MaxProofSize:        msg.MaxProofSize,
		NumConstraints:      msg.NumConstraints,
		NumVariables:        msg.NumVariables,
		NumPublicInputs:     msg.NumPublicInputs,
		VerificationMethod:  msg.VerificationMethod,
		TrustedSetup:        msg.TrustedSetup,
		Version:             1,
		Active:              true,
		CreatedAt:           ctx.BlockTime(),
		UpdatedAt:           ctx.BlockTime(),
		BlockHeight:         ctx.BlockHeight(),
		TxHash:              fmt.Sprintf("%X", ctx.TxBytes()),
		ProofCount:          0,
		SuccessfulProofs:    0,
	}

	// Store circuit
	if err := k.Keeper.CreateCircuit(ctx, circuit); err != nil {
		return nil, err
	}

	// Emit event
	ctx.EventManager().EmitEvents(sdk.Events{
		sdk.NewEvent(
			types.EventTypeCircuitCreated,
			sdk.NewAttribute(types.AttributeKeyCircuitID, circuit.Id),
			sdk.NewAttribute(types.AttributeKeyCreator, circuit.Creator),
			sdk.NewAttribute(types.AttributeKeyCircuitType, string(circuit.CircuitType)),
		),
	})

	return &types.MsgCreateCircuitResponse{
		CircuitId: circuit.Id,
	}, nil
}

// SubmitProof submits a zero-knowledge proof for verification.
func (k msgServer) SubmitProof(goCtx context.Context, msg *types.MsgSubmitProof) (*types.MsgSubmitProofResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// Validate DID exists
	if err := k.didKeeper.ValidateDID(ctx, msg.Prover); err != nil {
		return nil, errorsmod.Wrapf(types.ErrInvalidProver, "invalid prover DID: %s", err)
	}

	// Validate verifier DID if specified
	if msg.Verifier != "" {
		if err := k.didKeeper.ValidateDID(ctx, msg.Verifier); err != nil {
			return nil, errorsmod.Wrapf(types.ErrInvalidVerifier, "invalid verifier DID: %s", err)
		}
	}

	// Check circuit exists
	circuit, err := k.GetCircuit(ctx, msg.CircuitId)
	if err != nil {
		return nil, errorsmod.Wrapf(types.ErrInvalidCircuit, "circuit not found: %s", err)
	}

	// Check if circuit is active
	if !circuit.IsActive() {
		return nil, errorsmod.Wrap(types.ErrCircuitInactive, "circuit is not active")
	}

	// Get parameters
	params, err := k.GetParams(ctx)
	if err != nil {
		return nil, err
	}

	// Check proof size limits
	if uint64(len(msg.ProofData)) > params.MaxProofSize {
		return nil, errorsmod.Wrapf(types.ErrProofTooLarge, "proof data size %d exceeds limit %d", len(msg.ProofData), params.MaxProofSize)
	}

	// Check proof type is allowed
	allowed := false
	for _, allowedType := range params.AllowedProofTypes {
		if allowedType == types.ProofType(msg.ProofType) {
			allowed = true
			break
		}
	}
	if !allowed {
		return nil, errorsmod.Wrapf(types.ErrInvalidProofType, "proof type %s not allowed", msg.ProofType)
	}

	// Get prover's address
	proverAddr, err := sdk.AccAddressFromBech32(msg.Prover)
	if err != nil {
		return nil, errorsmod.Wrapf(types.ErrInvalidProver, "invalid prover address: %s", err)
	}

	// Charge proof submission fee
	if !params.ProofSubmissionFee.IsZero() {
		if err := k.bankKeeper.SendCoinsFromAccountToModule(ctx, proverAddr, types.ModuleName, params.ProofSubmissionFee); err != nil {
			return nil, errorsmod.Wrapf(types.ErrInsufficientFees, "failed to pay proof submission fee: %s", err)
		}
	}

	// Generate proof ID
	count, _ := k.ProofCount.Get(ctx)
	proofID := fmt.Sprintf("proof-%d", count+1)

	// Calculate validity period
	validFrom := ctx.BlockTime()
	var validTo *time.Time
	if params.ProofValidityPeriod > 0 {
		validToTime := validFrom.Add(time.Duration(params.ProofValidityPeriod) * time.Second)
		validTo = &validToTime
	}

	// Create proof
	proof := types.ZKProof{
		Id:                    proofID,
		CircuitId:            msg.CircuitId,
		Prover:               msg.Prover,
		Verifier:             msg.Verifier,
		ProofType:            types.ProofType(msg.ProofType),
		ProofData:            msg.ProofData,
		PublicInputs:         msg.PublicInputs,
		VerificationData:     msg.VerificationData,
		Status:               types.ProofStatusPending,
		ValidFrom:            validFrom,
		ValidTo:              validTo,
		VerificationMethod:   circuit.VerificationMethod,
		VerificationTimestamp: time.Time{},
		VerificationResult:   "",
		Description:          msg.Description,
		Tags:                 msg.Tags,
		Metadata:             msg.Metadata,
		CreatedAt:            ctx.BlockTime(),
		UpdatedAt:            ctx.BlockTime(),
		BlockHeight:          ctx.BlockHeight(),
		TxHash:               fmt.Sprintf("%X", ctx.TxBytes()),
		ProofFee:             msg.ProofFee,
	}

	// Store proof
	if err := k.Keeper.SubmitProof(ctx, proof); err != nil {
		return nil, err
	}

	// Emit event
	ctx.EventManager().EmitEvents(sdk.Events{
		sdk.NewEvent(
			types.EventTypeProofSubmitted,
			sdk.NewAttribute(types.AttributeKeyProofID, proof.Id),
			sdk.NewAttribute(types.AttributeKeyProver, proof.Prover),
			sdk.NewAttribute(types.AttributeKeyCircuitID, proof.CircuitId),
			sdk.NewAttribute(types.AttributeKeyProofType, string(proof.ProofType)),
		),
	})

	return &types.MsgSubmitProofResponse{
		ProofId: proof.Id,
	}, nil
}

// VerifyProof verifies a submitted proof.
func (k msgServer) VerifyProof(goCtx context.Context, msg *types.MsgVerifyProof) (*types.MsgVerifyProofResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// Validate verifier DID
	if err := k.didKeeper.ValidateDID(ctx, msg.Verifier); err != nil {
		return nil, errorsmod.Wrapf(types.ErrInvalidVerifier, "invalid verifier DID: %s", err)
	}

	// Get proof
	proof, err := k.GetProof(ctx, msg.ProofId)
	if err != nil {
		return nil, errorsmod.Wrapf(types.ErrInvalidProof, "proof not found: %s", err)
	}

	// Check if proof is expired
	if proof.IsExpired() {
		return nil, errorsmod.Wrap(types.ErrProofExpired, "proof has expired")
	}

	// Get parameters
	params, err := k.GetParams(ctx)
	if err != nil {
		return nil, err
	}

	// Get verifier's address
	verifierAddr, err := sdk.AccAddressFromBech32(msg.Verifier)
	if err != nil {
		return nil, errorsmod.Wrapf(types.ErrInvalidVerifier, "invalid verifier address: %s", err)
	}

	// Charge proof verification fee
	if !params.ProofVerificationFee.IsZero() {
		if err := k.bankKeeper.SendCoinsFromAccountToModule(ctx, verifierAddr, types.ModuleName, params.ProofVerificationFee); err != nil {
			return nil, errorsmod.Wrapf(types.ErrInsufficientFees, "failed to pay proof verification fee: %s", err)
		}
	}

	// Perform verification
	if err := k.Keeper.VerifyProof(ctx, msg.ProofId, msg.Verifier); err != nil {
		return nil, err
	}

	// Get updated proof
	updatedProof, err := k.GetProof(ctx, msg.ProofId)
	if err != nil {
		return nil, err
	}

	// Emit event
	ctx.EventManager().EmitEvents(sdk.Events{
		sdk.NewEvent(
			types.EventTypeProofVerified,
			sdk.NewAttribute(types.AttributeKeyProofID, updatedProof.Id),
			sdk.NewAttribute(types.AttributeKeyVerifier, msg.Verifier),
			sdk.NewAttribute(types.AttributeKeyProofStatus, string(updatedProof.Status)),
		),
	})

	return &types.MsgVerifyProofResponse{
		Status: string(updatedProof.Status),
		Valid:  updatedProof.Status == types.ProofStatusValid,
	}, nil
}

// CreateProofRequest creates a request for a zero-knowledge proof.
func (k msgServer) CreateProofRequest(goCtx context.Context, msg *types.MsgCreateProofRequest) (*types.MsgCreateProofRequestResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// Validate requester DID
	if err := k.didKeeper.ValidateDID(ctx, msg.Requester); err != nil {
		return nil, errorsmod.Wrapf(types.ErrInvalidVerifier, "invalid requester DID: %s", err)
	}

	// Validate target prover DID
	if err := k.didKeeper.ValidateDID(ctx, msg.TargetProver); err != nil {
		return nil, errorsmod.Wrapf(types.ErrInvalidProver, "invalid target prover DID: %s", err)
	}

	// Check circuit exists
	_, err := k.GetCircuit(ctx, msg.CircuitId)
	if err != nil {
		return nil, errorsmod.Wrapf(types.ErrInvalidCircuit, "circuit not found: %s", err)
	}

	// Get parameters
	params, err := k.GetParams(ctx)
	if err != nil {
		return nil, err
	}

	// Get requester's address
	requesterAddr, err := sdk.AccAddressFromBech32(msg.Requester)
	if err != nil {
		return nil, errorsmod.Wrapf(types.ErrInvalidVerifier, "invalid requester address: %s", err)
	}

	// Charge proof request fee
	if !params.ProofRequestFee.IsZero() {
		if err := k.bankKeeper.SendCoinsFromAccountToModule(ctx, requesterAddr, types.ModuleName, params.ProofRequestFee); err != nil {
			return nil, errorsmod.Wrapf(types.ErrInsufficientFees, "failed to pay proof request fee: %s", err)
		}
	}

	// Generate request ID
	count, _ := k.ProofRequestCount.Get(ctx)
	requestID := fmt.Sprintf("request-%d", count+1)

	// Create proof request
	request := types.ProofRequest{
		Id:                   requestID,
		Requester:           msg.Requester,
		TargetProver:        msg.TargetProver,
		CircuitId:           msg.CircuitId,
		RequiredProofType:   types.ProofType(msg.RequiredProofType),
		Challenge:           msg.Challenge,
		RequiredPublicInputs: msg.RequiredPublicInputs,
		Deadline:            msg.Deadline,
		Reward:              msg.Reward,
		Status:              "pending",
		ProofId:             "",
		CreatedAt:           ctx.BlockTime(),
		CompletedAt:         time.Time{},
		BlockHeight:         ctx.BlockHeight(),
		TxHash:              fmt.Sprintf("%X", ctx.TxBytes()),
	}

	// Store request
	if err := k.Keeper.CreateProofRequest(ctx, request); err != nil {
		return nil, err
	}

	// Emit event
	ctx.EventManager().EmitEvents(sdk.Events{
		sdk.NewEvent(
			types.EventTypeProofRequestCreated,
			sdk.NewAttribute(types.AttributeKeyProofRequestID, request.Id),
			sdk.NewAttribute(types.AttributeKeyRequester, request.Requester),
			sdk.NewAttribute(types.AttributeKeyTargetProver, request.TargetProver),
			sdk.NewAttribute(types.AttributeKeyCircuitID, request.CircuitId),
		),
	})

	return &types.MsgCreateProofRequestResponse{
		RequestId: request.Id,
	}, nil
}

// UpdateCircuit updates an existing circuit.
func (k msgServer) UpdateCircuit(goCtx context.Context, msg *types.MsgUpdateCircuit) (*types.MsgUpdateCircuitResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// Get existing circuit
	circuit, err := k.GetCircuit(ctx, msg.CircuitId)
	if err != nil {
		return nil, errorsmod.Wrapf(types.ErrInvalidCircuit, "circuit not found: %s", err)
	}

	// Check if the creator is the same
	if circuit.Creator != msg.Creator {
		return nil, errorsmod.Wrap(types.ErrUnauthorized, "only circuit creator can update circuit")
	}

	// Validate DID exists
	if err := k.didKeeper.ValidateDID(ctx, msg.Creator); err != nil {
		return nil, errorsmod.Wrapf(types.ErrInvalidProver, "invalid creator DID: %s", err)
	}

	// Update circuit fields
	if msg.Name != "" {
		circuit.Name = msg.Name
	}
	if msg.Description != "" {
		circuit.Description = msg.Description
	}
	if msg.Active != nil {
		circuit.Active = *msg.Active
	}

	circuit.UpdatedAt = ctx.BlockTime()
	circuit.Version++

	// Store updated circuit
	if err := k.Circuits.Set(ctx, circuit.Id, circuit); err != nil {
		return nil, err
	}

	// Emit event
	ctx.EventManager().EmitEvents(sdk.Events{
		sdk.NewEvent(
			types.EventTypeCircuitUpdated,
			sdk.NewAttribute(types.AttributeKeyCircuitID, circuit.Id),
			sdk.NewAttribute(types.AttributeKeyCreator, circuit.Creator),
			sdk.NewAttribute("version", strconv.FormatUint(circuit.Version, 10)),
		),
	})

	return &types.MsgUpdateCircuitResponse{
		Success: true,
	}, nil
}