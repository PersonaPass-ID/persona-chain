package keeper

import (
	"context"

	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/PersonaPass-ID/persona-chain/x/identity/types"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var _ types.QueryServer = Keeper{}

// Identity implements the Query/Identity gRPC method
func (k Keeper) Identity(goCtx context.Context, req *types.QueryIdentityRequest) (*types.QueryIdentityResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	ctx := sdk.UnwrapSDKContext(goCtx)

	identity, err := k.GetIdentity(ctx, req.Address)
	if err != nil {
		return nil, status.Error(codes.NotFound, err.Error())
	}

	return &types.QueryIdentityResponse{
		Identity: identity,
	}, nil
}

// Credential implements the Query/Credential gRPC method
func (k Keeper) Credential(goCtx context.Context, req *types.QueryCredentialRequest) (*types.QueryCredentialResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	ctx := sdk.UnwrapSDKContext(goCtx)

	credential, err := k.GetCredential(ctx, req.CredentialId)
	if err != nil {
		return nil, status.Error(codes.NotFound, err.Error())
	}

	return &types.QueryCredentialResponse{
		Credential: credential,
	}, nil
}

// Credentials implements the Query/Credentials gRPC method
func (k Keeper) Credentials(goCtx context.Context, req *types.QueryCredentialsRequest) (*types.QueryCredentialsResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	ctx := sdk.UnwrapSDKContext(goCtx)
	store := ctx.KVStore(k.storeKey)

	var credentials []types.Credential

	// Iterate through credential index for the subject
	iterator := sdk.KVStorePrefixIterator(store, append(types.CredentialIDIndexKeyPrefix, []byte(req.SubjectDid)...))
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		// Extract credential ID from the key
		fullKey := iterator.Key()
		prefixLen := len(types.CredentialIDIndexKeyPrefix) + len(req.SubjectDid)
		credentialID := string(fullKey[prefixLen:])

		// Fetch the credential
		credential, err := k.GetCredential(ctx, credentialID)
		if err == nil {
			credentials = append(credentials, *credential)
		}
	}

	return &types.QueryCredentialsResponse{
		Credentials: credentials,
		Pagination:  &query.PageResponse{Total: uint64(len(credentials))},
	}, nil
}

// Verifications implements the Query/Verifications gRPC method
func (k Keeper) Verifications(goCtx context.Context, req *types.QueryVerificationsRequest) (*types.QueryVerificationsResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	ctx := sdk.UnwrapSDKContext(goCtx)
	store := ctx.KVStore(k.storeKey)

	var verifications []types.Verification

	// Iterate through all verifications
	// In a real implementation, you'd want to index by credential ID for efficiency
	iterator := sdk.KVStorePrefixIterator(store, types.VerificationKeyPrefix)
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		var verification types.Verification
		k.cdc.MustUnmarshal(iterator.Value(), &verification)

		if verification.CredentialID == req.CredentialId {
			verifications = append(verifications, verification)
		}
	}

	return &types.QueryVerificationsResponse{
		Verifications: verifications,
		Pagination:    &query.PageResponse{Total: uint64(len(verifications))},
	}, nil
}

// Params implements the Query/Params gRPC method
func (k Keeper) Params(goCtx context.Context, req *types.QueryParamsRequest) (*types.QueryParamsResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	ctx := sdk.UnwrapSDKContext(goCtx)

	return &types.QueryParamsResponse{
		Params: k.GetParams(ctx),
	}, nil
}