package keeper

import (
	"context"
	"time"

	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/PersonaPass-ID/personachain/x/credential/types"
)

type msgServer struct {
	Keeper
}

// NewMsgServerImpl returns an implementation of the MsgServer interface for the provided Keeper.
func NewMsgServerImpl(keeper Keeper) types.MsgServer {
	return &msgServer{Keeper: keeper}
}

var _ types.MsgServer = msgServer{}

// CreateCredential handles creating a new verifiable credential.
func (k msgServer) CreateCredential(goCtx context.Context, msg *types.MsgCreateCredential) (*types.MsgCreateCredentialResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// Validate message
	if err := msg.ValidateBasic(); err != nil {
		return nil, err
	}

	// Get parameters
	params, err := k.GetParams(goCtx)
	if err != nil {
		return nil, err
	}

	// Charge fee
	issuerAddr, err := sdk.AccAddressFromBech32(msg.Issuer)
	if err != nil {
		return nil, types.ErrInvalidIssuer
	}

	if err := k.bankKeeper.SendCoinsFromAccountToModule(goCtx, issuerAddr, types.ModuleName, params.CreateCredentialFee); err != nil {
		return nil, types.ErrInsufficientFunds
	}

	// Create the credential
	credential := types.VerifiableCredential{
		Context:           msg.Context,
		ID:                msg.Id,
		Type:              msg.CredentialType,
		Issuer:            msg.Issuer,
		IssuanceDate:      time.Now(),
		ExpirationDate:    msg.ExpirationDate,
		CredentialSubject: *msg.CredentialSubject,
		Proof:             msg.Proof,
		CredentialStatus:  msg.CredentialStatus,
		BlockHeight:       ctx.BlockHeight(),
		TxHash:            string(ctx.TxBytes()),
		Created:           time.Now(),
		Updated:           time.Now(),
		Active:            true,
		Revoked:           false,
	}

	// Store the credential
	if err := k.Keeper.CreateCredential(goCtx, credential); err != nil {
		return nil, err
	}

	// Emit event
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			types.EventTypeCredentialCreated,
			sdk.NewAttribute(types.AttributeKeyCredentialID, credential.ID),
			sdk.NewAttribute(types.AttributeKeyIssuer, credential.Issuer),
			sdk.NewAttribute(types.AttributeKeySubject, credential.CredentialSubject.ID),
		),
	)

	return &types.MsgCreateCredentialResponse{
		CredentialId: credential.ID,
	}, nil
}

// RevokeCredential handles revoking a verifiable credential.
func (k msgServer) RevokeCredential(goCtx context.Context, msg *types.MsgRevokeCredential) (*types.MsgRevokeCredentialResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// Validate message
	if err := msg.ValidateBasic(); err != nil {
		return nil, err
	}

	// Revoke the credential
	if err := k.Keeper.RevokeCredential(goCtx, msg.CredentialId, msg.Revoker); err != nil {
		return nil, err
	}

	// Emit event
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			types.EventTypeCredentialRevoked,
			sdk.NewAttribute(types.AttributeKeyCredentialID, msg.CredentialId),
			sdk.NewAttribute(types.AttributeKeyRevoker, msg.Revoker),
		),
	)

	return &types.MsgRevokeCredentialResponse{}, nil
}

// CreatePresentation handles creating a verifiable presentation.
func (k msgServer) CreatePresentation(goCtx context.Context, msg *types.MsgCreatePresentation) (*types.MsgCreatePresentationResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// Validate message
	if err := msg.ValidateBasic(); err != nil {
		return nil, err
	}

	// Get parameters
	params, err := k.GetParams(goCtx)
	if err != nil {
		return nil, err
	}

	// Charge fee
	holderAddr, err := sdk.AccAddressFromBech32(msg.Holder)
	if err != nil {
		return nil, types.ErrInvalidHolder
	}

	if err := k.bankKeeper.SendCoinsFromAccountToModule(goCtx, holderAddr, types.ModuleName, params.CreatePresentationFee); err != nil {
		return nil, types.ErrInsufficientFunds
	}

	// Create the presentation
	presentation := types.VerifiablePresentation{
		Context:              msg.Context,
		ID:                   msg.Id,
		Type:                 msg.PresentationType,
		Holder:               msg.Holder,
		VerifiableCredential: msg.VerifiableCredential,
		Proof:                msg.Proof,
		Created:              time.Now(),
	}

	// Store the presentation
	if err := k.Keeper.CreatePresentation(goCtx, presentation); err != nil {
		return nil, err
	}

	// Emit event
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			types.EventTypePresentationCreated,
			sdk.NewAttribute(types.AttributeKeyPresentationID, presentation.ID),
			sdk.NewAttribute(types.AttributeKeyHolder, presentation.Holder),
		),
	)

	return &types.MsgCreatePresentationResponse{
		PresentationId: presentation.ID,
	}, nil
}