package keeper

import (
	"context"

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