package keeper

import (
	"context"
	"fmt"

	"cosmossdk.io/log"
	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/PersonaPass-ID/personachain/x/did/types"
)

type Keeper struct {
	cdc      codec.BinaryCodec
	storeKey storetypes.StoreKey
	logger   log.Logger

	// Expected keepers
	bankKeeper    types.BankKeeper
	accountKeeper types.AccountKeeper

	// Authority for parameter updates
	authority string
}

// NewKeeper creates a new DID keeper
func NewKeeper(
	cdc codec.BinaryCodec,
	storeKey storetypes.StoreKey,
	logger log.Logger,
	bankKeeper types.BankKeeper,
	accountKeeper types.AccountKeeper,
	authority string,
) *Keeper {
	return &Keeper{
		cdc:           cdc,
		storeKey:      storeKey,
		logger:        logger,
		bankKeeper:    bankKeeper,
		accountKeeper: accountKeeper,
		authority:     authority,
	}
}

// Logger returns a module-specific logger
func (k Keeper) Logger() log.Logger {
	return k.logger.With("module", "x/"+types.ModuleName)
}

// GetAuthority returns the authority address
func (k Keeper) GetAuthority() string {
	return k.authority
}

// CreateDID creates a new DID document
func (k Keeper) CreateDID(ctx context.Context, msg *types.MsgCreateDID) (*types.MsgCreateDIDResponse, error) {
	sdkCtx := sdk.UnwrapSDKContext(ctx)

	// Validate controller address
	controllerAddr, err := sdk.AccAddressFromBech32(msg.Controller)
	if err != nil {
		return nil, types.ErrInvalidController
	}

	// Check if DID already exists
	store := sdkCtx.KVStore(k.storeKey)
	didKey := types.DIDKey(msg.DIDDocument.ID)
	if store.Has(didKey) {
		return nil, types.ErrDIDAlreadyExists
	}

	// Get parameters for fee calculation
	params := k.GetParams(sdkCtx)

	// Charge creation fee
	if !params.DIDCreationFee.IsZero() {
		fee := sdk.NewCoins(sdk.NewCoin("upersona", params.DIDCreationFee))
		if err := k.bankKeeper.SendCoinsFromAccountToModule(sdkCtx, controllerAddr, types.ModuleName, fee); err != nil {
			return nil, types.ErrInsufficientFunds
		}
	}

	// Set creation timestamp
	msg.DIDDocument.Created = sdkCtx.BlockTime()
	msg.DIDDocument.Updated = sdkCtx.BlockTime()

	// Store DID document
	didBz := k.cdc.MustMarshal(&msg.DIDDocument)
	store.Set(didKey, didBz)

	// Create controller index
	controllerKey := types.DIDByControllerKey(msg.Controller, msg.DIDDocument.ID)
	store.Set(controllerKey, []byte(msg.DIDDocument.ID))

	// Update DID count
	count := k.GetDIDCount(sdkCtx)
	k.SetDIDCount(sdkCtx, count+1)

	// Emit event
	sdkCtx.EventManager().EmitEvent(
		sdk.NewEvent(
			types.EventTypeCreateDID,
			sdk.NewAttribute(types.AttributeKeyDIDID, msg.DIDDocument.ID),
			sdk.NewAttribute(types.AttributeKeyController, msg.Controller),
			sdk.NewAttribute(types.AttributeKeyCreated, msg.DIDDocument.Created.String()),
		),
	)

	return &types.MsgCreateDIDResponse{
		ID: msg.DIDDocument.ID,
	}, nil
}

// UpdateDID updates an existing DID document
func (k Keeper) UpdateDID(ctx context.Context, msg *types.MsgUpdateDID) (*types.MsgUpdateDIDResponse, error) {
	sdkCtx := sdk.UnwrapSDKContext(ctx)

	// Validate controller address
	controllerAddr, err := sdk.AccAddressFromBech32(msg.Controller)
	if err != nil {
		return nil, types.ErrInvalidController
	}

	// Get existing DID document
	store := sdkCtx.KVStore(k.storeKey)
	didKey := types.DIDKey(msg.ID)
	existingBz := store.Get(didKey)
	if existingBz == nil {
		return nil, types.ErrDIDNotFound
	}

	var existingDID types.DIDDocument
	k.cdc.MustUnmarshal(existingBz, &existingDID)

	// Check if DID is deactivated
	if existingDID.Deactivated {
		return nil, types.ErrDIDDeactivated
	}

	// Get parameters for fee calculation
	params := k.GetParams(sdkCtx)

	// Charge update fee
	if !params.DIDUpdateFee.IsZero() {
		fee := sdk.NewCoins(sdk.NewCoin("upersona", params.DIDUpdateFee))
		if err := k.bankKeeper.SendCoinsFromAccountToModule(sdkCtx, controllerAddr, types.ModuleName, fee); err != nil {
			return nil, types.ErrInsufficientFunds
		}
	}

	// Update document with new information but preserve timestamps
	msg.DIDDocument.Created = existingDID.Created
	msg.DIDDocument.Updated = sdkCtx.BlockTime()
	msg.DIDDocument.ID = msg.ID

	// Store updated DID document
	updatedBz := k.cdc.MustMarshal(&msg.DIDDocument)
	store.Set(didKey, updatedBz)

	// Emit event
	sdkCtx.EventManager().EmitEvent(
		sdk.NewEvent(
			types.EventTypeUpdateDID,
			sdk.NewAttribute(types.AttributeKeyDIDID, msg.ID),
			sdk.NewAttribute(types.AttributeKeyController, msg.Controller),
			sdk.NewAttribute(types.AttributeKeyUpdated, msg.DIDDocument.Updated.String()),
		),
	)

	return &types.MsgUpdateDIDResponse{}, nil
}

// DeactivateDID deactivates a DID document
func (k Keeper) DeactivateDID(ctx context.Context, msg *types.MsgDeactivateDID) (*types.MsgDeactivateDIDResponse, error) {
	sdkCtx := sdk.UnwrapSDKContext(ctx)

	// Get existing DID document
	store := sdkCtx.KVStore(k.storeKey)
	didKey := types.DIDKey(msg.ID)
	existingBz := store.Get(didKey)
	if existingBz == nil {
		return nil, types.ErrDIDNotFound
	}

	var existingDID types.DIDDocument
	k.cdc.MustUnmarshal(existingBz, &existingDID)

	// Check if already deactivated
	if existingDID.Deactivated {
		return &types.MsgDeactivateDIDResponse{}, nil
	}

	// Deactivate the DID
	existingDID.Deactivated = true
	existingDID.Updated = sdkCtx.BlockTime()

	// Store deactivated DID document
	deactivatedBz := k.cdc.MustMarshal(&existingDID)
	store.Set(didKey, deactivatedBz)

	// Emit event
	sdkCtx.EventManager().EmitEvent(
		sdk.NewEvent(
			types.EventTypeDeactivateDID,
			sdk.NewAttribute(types.AttributeKeyDIDID, msg.ID),
			sdk.NewAttribute(types.AttributeKeyController, msg.Controller),
			sdk.NewAttribute(types.AttributeKeyDeactivated, "true"),
		),
	)

	return &types.MsgDeactivateDIDResponse{}, nil
}

// UpdateParams updates the module parameters
func (k Keeper) UpdateParams(ctx context.Context, msg *types.MsgUpdateParams) (*types.MsgUpdateParamsResponse, error) {
	sdkCtx := sdk.UnwrapSDKContext(ctx)

	// Validate authority
	if msg.Authority != k.authority {
		return nil, types.ErrUnauthorized
	}

	// Set parameters
	k.SetParams(sdkCtx, msg.Params)

	// Emit event
	sdkCtx.EventManager().EmitEvent(
		sdk.NewEvent(
			types.EventTypeUpdateParams,
			sdk.NewAttribute(types.AttributeKeyAuthority, msg.Authority),
		),
	)

	return &types.MsgUpdateParamsResponse{}, nil
}

// GetDID retrieves a DID document by ID
func (k Keeper) GetDID(ctx sdk.Context, id string) (types.DIDDocument, bool) {
	store := ctx.KVStore(k.storeKey)
	didKey := types.DIDKey(id)
	bz := store.Get(didKey)
	if bz == nil {
		return types.DIDDocument{}, false
	}

	var did types.DIDDocument
	k.cdc.MustUnmarshal(bz, &did)
	return did, true
}

// GetAllDIDs retrieves all DID documents
func (k Keeper) GetAllDIDs(ctx sdk.Context) []types.DIDDocument {
	store := ctx.KVStore(k.storeKey)
	iterator := storetypes.KVStorePrefixIterator(store, types.DIDPrefixKey())
	defer iterator.Close()

	var dids []types.DIDDocument
	for ; iterator.Valid(); iterator.Next() {
		var did types.DIDDocument
		k.cdc.MustUnmarshal(iterator.Value(), &did)
		dids = append(dids, did)
	}

	return dids
}

// GetDIDsByController retrieves all DIDs controlled by a specific controller
func (k Keeper) GetDIDsByController(ctx sdk.Context, controller string) []types.DIDDocument {
	store := ctx.KVStore(k.storeKey)
	prefix := types.DIDByControllerPrefixKey(controller)
	iterator := storetypes.KVStorePrefixIterator(store, prefix)
	defer iterator.Close()

	var dids []types.DIDDocument
	for ; iterator.Valid(); iterator.Next() {
		didID := string(iterator.Value())
		if did, found := k.GetDID(ctx, didID); found {
			dids = append(dids, did)
		}
	}

	return dids
}

// GetParams retrieves the module parameters
func (k Keeper) GetParams(ctx sdk.Context) types.Params {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte(types.ParamsKey))
	if bz == nil {
		return types.DefaultParams()
	}

	var params types.Params
	k.cdc.MustUnmarshal(bz, &params)
	return params
}

// SetParams sets the module parameters
func (k Keeper) SetParams(ctx sdk.Context, params types.Params) {
	store := ctx.KVStore(k.storeKey)
	bz := k.cdc.MustMarshal(&params)
	store.Set([]byte(types.ParamsKey), bz)
}

// GetDIDCount retrieves the total count of DIDs
func (k Keeper) GetDIDCount(ctx sdk.Context) uint64 {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte(types.DIDCountKey))
	if bz == nil {
		return 0
	}
	return types.BytesToUint64(bz)
}

// SetDIDCount sets the total count of DIDs
func (k Keeper) SetDIDCount(ctx sdk.Context, count uint64) {
	store := ctx.KVStore(k.storeKey)
	bz := types.Uint64ToBytes(count)
	store.Set([]byte(types.DIDCountKey), bz)
}

// GetStoreKey returns the store key for external access
func (k Keeper) GetStoreKey() storetypes.StoreKey {
	return k.storeKey
}

// GetCodec returns the codec for external access
func (k Keeper) GetCodec() codec.BinaryCodec {
	return k.cdc
}

// ValidateDID checks if a DID exists and is active (for ZK proof keeper interface)
func (k Keeper) ValidateDID(ctx context.Context, did string) error {
	sdkCtx := sdk.UnwrapSDKContext(ctx)
	didDoc, found := k.GetDID(sdkCtx, did)
	if !found {
		return types.ErrDIDNotFound
	}
	if didDoc.Deactivated {
		return types.ErrDIDDeactivated
	}
	return nil
}

// GetDIDDocument retrieves a DID document (for ZK proof keeper interface)
func (k Keeper) GetDIDDocument(ctx context.Context, did string) (interface{}, error) {
	sdkCtx := sdk.UnwrapSDKContext(ctx)
	didDoc, found := k.GetDID(sdkCtx, did)
	if !found {
		return nil, types.ErrDIDNotFound
	}
	return didDoc, nil
}

// ResolveDID resolves a DID to its document (for ZK proof keeper interface)
func (k Keeper) ResolveDID(ctx context.Context, did string) (interface{}, error) {
	return k.GetDIDDocument(ctx, did)
}

// Authentication method operations

// LinkAuthMethod links an authentication method to a DID
func (k Keeper) LinkAuthMethod(ctx context.Context, msg *types.MsgLinkAuthMethod) (*types.MsgLinkAuthMethodResponse, error) {
	sdkCtx := sdk.UnwrapSDKContext(ctx)

	// Validate DID exists and is active
	didDoc, found := k.GetDID(sdkCtx, msg.DID)
	if !found {
		return nil, types.ErrDIDNotFound
	}
	if didDoc.Deactivated {
		return nil, types.ErrDIDDeactivated
	}

	// Validate signer is DID controller
	_, err := sdk.AccAddressFromBech32(msg.Signer)
	if err != nil {
		return nil, types.ErrInvalidController
	}

	// Check if auth method already exists
	store := sdkCtx.KVStore(k.storeKey)
	authMethodKey := types.AuthMethodKey(msg.DID, msg.MethodID)
	if store.Has(authMethodKey) {
		return nil, types.ErrAuthMethodExists
	}

	// Check auth method limit per DID (prevent spam)
	existingMethods := k.GetAuthMethodsByDID(sdkCtx, msg.DID)
	if len(existingMethods) >= 10 { // Max 10 auth methods per DID
		return nil, types.ErrTooManyAuthMethods
	}

	// If this is marked as primary, unset other primary methods
	if msg.IsPrimary {
		for _, method := range existingMethods {
			if method.IsPrimary {
				method.IsPrimary = false
				k.setAuthMethod(sdkCtx, msg.DID, method)
			}
		}
	}

	// Create auth method
	authMethod := types.AuthMethod{
		MethodID:      msg.MethodID,
		MethodType:    msg.MethodType,
		PublicKeyHash: msg.PublicKeyHash,
		Attestation:   msg.Attestation,
		LinkedAt:      sdkCtx.BlockTime(),
		IsActive:      true,
		IsPrimary:     msg.IsPrimary,
	}

	// Store auth method
	k.setAuthMethod(sdkCtx, msg.DID, authMethod)

	// Create index for DID -> auth methods
	indexKey := types.AuthMethodByDIDKey(msg.DID)
	store.Set(append(indexKey, []byte(msg.MethodID)...), []byte(msg.MethodID))

	// Emit event
	sdkCtx.EventManager().EmitEvent(
		sdk.NewEvent(
			"link_auth_method",
			sdk.NewAttribute("did", msg.DID),
			sdk.NewAttribute("method_id", msg.MethodID),
			sdk.NewAttribute("method_type", msg.MethodType),
			sdk.NewAttribute("is_primary", fmt.Sprintf("%t", msg.IsPrimary)),
		),
	)

	return &types.MsgLinkAuthMethodResponse{
		MethodID: msg.MethodID,
	}, nil
}

// UnlinkAuthMethod removes an authentication method from a DID
func (k Keeper) UnlinkAuthMethod(ctx context.Context, msg *types.MsgUnlinkAuthMethod) (*types.MsgUnlinkAuthMethodResponse, error) {
	sdkCtx := sdk.UnwrapSDKContext(ctx)

	// Validate DID exists
	didDoc, found := k.GetDID(sdkCtx, msg.DID)
	if !found {
		return nil, types.ErrDIDNotFound
	}
	if didDoc.Deactivated {
		return nil, types.ErrDIDDeactivated
	}

	// Get auth method
	authMethod, found := k.GetAuthMethod(sdkCtx, msg.DID, msg.MethodID)
	if !found {
		return nil, types.ErrAuthMethodNotFound
	}

	// Prevent removing primary auth method if it's the only one
	if authMethod.IsPrimary {
		existingMethods := k.GetAuthMethodsByDID(sdkCtx, msg.DID)
		if len(existingMethods) <= 1 {
			return nil, types.ErrPrimaryAuthMethod
		}
		
		// If removing primary, set another method as primary
		for _, method := range existingMethods {
			if method.MethodID != msg.MethodID && method.IsActive {
				method.IsPrimary = true
				k.setAuthMethod(sdkCtx, msg.DID, method)
				break
			}
		}
	}

	// Remove auth method
	store := sdkCtx.KVStore(k.storeKey)
	authMethodKey := types.AuthMethodKey(msg.DID, msg.MethodID)
	store.Delete(authMethodKey)

	// Remove from index
	indexKey := append(types.AuthMethodByDIDKey(msg.DID), []byte(msg.MethodID)...)
	store.Delete(indexKey)

	// Emit event
	sdkCtx.EventManager().EmitEvent(
		sdk.NewEvent(
			"unlink_auth_method",
			sdk.NewAttribute("did", msg.DID),
			sdk.NewAttribute("method_id", msg.MethodID),
		),
	)

	return &types.MsgUnlinkAuthMethodResponse{}, nil
}

// UpdateAuthMethod updates an authentication method
func (k Keeper) UpdateAuthMethod(ctx context.Context, msg *types.MsgUpdateAuthMethod) (*types.MsgUpdateAuthMethodResponse, error) {
	sdkCtx := sdk.UnwrapSDKContext(ctx)

	// Validate DID exists
	didDoc, found := k.GetDID(sdkCtx, msg.DID)
	if !found {
		return nil, types.ErrDIDNotFound
	}
	if didDoc.Deactivated {
		return nil, types.ErrDIDDeactivated
	}

	// Get existing auth method
	authMethod, found := k.GetAuthMethod(sdkCtx, msg.DID, msg.MethodID)
	if !found {
		return nil, types.ErrAuthMethodNotFound
	}

	// If setting as primary, unset other primary methods
	if msg.IsPrimary && !authMethod.IsPrimary {
		existingMethods := k.GetAuthMethodsByDID(sdkCtx, msg.DID)
		for _, method := range existingMethods {
			if method.IsPrimary {
				method.IsPrimary = false
				k.setAuthMethod(sdkCtx, msg.DID, method)
			}
		}
	}

	// Update auth method
	authMethod.IsPrimary = msg.IsPrimary
	authMethod.IsActive = msg.IsActive
	k.setAuthMethod(sdkCtx, msg.DID, authMethod)

	// Emit event
	sdkCtx.EventManager().EmitEvent(
		sdk.NewEvent(
			"update_auth_method",
			sdk.NewAttribute("did", msg.DID),
			sdk.NewAttribute("method_id", msg.MethodID),
			sdk.NewAttribute("is_primary", fmt.Sprintf("%t", msg.IsPrimary)),
			sdk.NewAttribute("is_active", fmt.Sprintf("%t", msg.IsActive)),
		),
	)

	return &types.MsgUpdateAuthMethodResponse{}, nil
}

// GetAuthMethod retrieves an authentication method
func (k Keeper) GetAuthMethod(ctx sdk.Context, did, methodID string) (types.AuthMethod, bool) {
	store := ctx.KVStore(k.storeKey)
	authMethodKey := types.AuthMethodKey(did, methodID)
	bz := store.Get(authMethodKey)
	if bz == nil {
		return types.AuthMethod{}, false
	}

	var authMethod types.AuthMethod
	k.cdc.MustUnmarshal(bz, &authMethod)
	return authMethod, true
}

// GetAuthMethodsByDID retrieves all authentication methods for a DID
func (k Keeper) GetAuthMethodsByDID(ctx sdk.Context, did string) []types.AuthMethod {
	store := ctx.KVStore(k.storeKey)
	prefix := types.AuthMethodByDIDPrefixKey(did)
	iterator := storetypes.KVStorePrefixIterator(store, prefix)
	defer iterator.Close()

	var methods []types.AuthMethod
	for ; iterator.Valid(); iterator.Next() {
		methodID := string(iterator.Value())
		if method, found := k.GetAuthMethod(ctx, did, methodID); found {
			methods = append(methods, method)
		}
	}

	return methods
}

// setAuthMethod is a private helper to store an auth method
func (k Keeper) setAuthMethod(ctx sdk.Context, did string, authMethod types.AuthMethod) {
	store := ctx.KVStore(k.storeKey)
	authMethodKey := types.AuthMethodKey(did, authMethod.MethodID)
	bz := k.cdc.MustMarshal(&authMethod)
	store.Set(authMethodKey, bz)
}