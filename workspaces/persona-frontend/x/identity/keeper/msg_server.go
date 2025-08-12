package keeper

import (
	"context"

	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/PersonaPass-ID/persona-chain/x/identity/types"
)

type msgServer struct {
	Keeper
}

// NewMsgServerImpl returns an implementation of the MsgServer interface
// for the provided Keeper.
func NewMsgServerImpl(keeper Keeper) types.MsgServer {
	return &msgServer{Keeper: keeper}
}

var _ types.MsgServer = msgServer{}

// CreateIdentity implements types.MsgServer
func (k msgServer) CreateIdentity(goCtx context.Context, msg *types.MsgCreateIdentity) (*types.MsgCreateIdentityResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	err := k.Keeper.CreateIdentity(ctx, msg.Creator, msg.DIDDocument)
	if err != nil {
		return nil, err
	}

	return &types.MsgCreateIdentityResponse{}, nil
}

// IssueCredential implements types.MsgServer
func (k msgServer) IssueCredential(goCtx context.Context, msg *types.MsgIssueCredential) (*types.MsgIssueCredentialResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	credentialID, err := k.Keeper.IssueCredential(
		ctx,
		msg.Issuer,
		msg.SubjectDID,
		msg.CredentialType,
		msg.CredentialData,
		msg.Expiry,
	)
	if err != nil {
		return nil, err
	}

	return &types.MsgIssueCredentialResponse{
		CredentialId: credentialID,
	}, nil
}

// VerifyCredential implements types.MsgServer
func (k msgServer) VerifyCredential(goCtx context.Context, msg *types.MsgVerifyCredential) (*types.MsgVerifyCredentialResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	err := k.Keeper.VerifyCredential(ctx, msg.Verifier, msg.CredentialID, msg.ProofData)
	if err != nil {
		return nil, err
	}

	return &types.MsgVerifyCredentialResponse{
		Verified: true,
	}, nil
}

// RevokeCredential implements types.MsgServer
func (k msgServer) RevokeCredential(goCtx context.Context, msg *types.MsgRevokeCredential) (*types.MsgRevokeCredentialResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	err := k.Keeper.RevokeCredential(ctx, msg.Issuer, msg.CredentialID, msg.Reason)
	if err != nil {
		return nil, err
	}

	return &types.MsgRevokeCredentialResponse{}, nil
}