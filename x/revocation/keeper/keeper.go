package keeper

import (
	"context"
	"fmt"

	"cosmossdk.io/core/store"
	storetypes "cosmossdk.io/store/types"
	"cosmossdk.io/log"
	
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	authkeeper "github.com/cosmos/cosmos-sdk/x/auth/keeper"
	bankkeeper "github.com/cosmos/cosmos-sdk/x/bank/keeper"
	didkeeper "github.com/PersonaPass-ID/personachain/x/did/keeper"
	
	"github.com/PersonaPass-ID/personachain/x/revocation/types"
)

// Keeper maintains the link to data storage and exposes getter/setter methods for the various parts of the state machine
type Keeper struct {
	cdc      codec.BinaryCodec
	storeKey storetypes.StoreKey
	logger   log.Logger
	
	// External keepers
	authKeeper authkeeper.AccountKeeper
	bankKeeper bankkeeper.Keeper
	didKeeper  *didkeeper.Keeper
	
	// Authority is the module authority
	authority string
}

// NewKeeper creates a new revocation Keeper instance
func NewKeeper(
	cdc codec.BinaryCodec,
	storeService store.KVStoreService,
	authority string,
	authKeeper authkeeper.AccountKeeper,
	bankKeeper bankkeeper.Keeper,
	didKeeper *didkeeper.Keeper,
) *Keeper {
	return &Keeper{
		cdc:        cdc,
		storeKey:   storeService.OpenKVStore(context.Background()),
		logger:     log.NewNopLogger(),
		authKeeper: authKeeper,
		bankKeeper: bankKeeper,
		didKeeper:  didKeeper,
		authority:  authority,
	}
}

// Logger returns a module-specific logger.
func (k Keeper) Logger() log.Logger {
	return k.logger.With("module", fmt.Sprintf("x/%s", types.ModuleName))
}

// GetAuthority returns the module's authority.
func (k Keeper) GetAuthority() string {
	return k.authority
}

// RevokeCredential creates a revocation entry for a credential
func (k Keeper) RevokeCredential(ctx sdk.Context, entry *types.RevocationEntry) error {
	if err := entry.Validate(); err != nil {
		return err
	}
	
	store := ctx.KVStore(k.storeKey)
	bz := k.cdc.MustMarshal(entry)
	store.Set(types.RevocationKey(entry.ID), bz)
	
	return nil
}

// GetRevocation retrieves a revocation entry
func (k Keeper) GetRevocation(ctx sdk.Context, revocationID string) (*types.RevocationEntry, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(types.RevocationKey(revocationID))
	
	if bz == nil {
		return nil, types.ErrRevocationNotFound
	}
	
	var entry types.RevocationEntry
	k.cdc.MustUnmarshal(bz, &entry)
	
	return &entry, nil
}

// IsRevoked checks if a credential is revoked
func (k Keeper) IsRevoked(ctx sdk.Context, credentialID string) bool {
	store := ctx.KVStore(k.storeKey)
	iterator := store.Iterator(nil, nil)
	defer iterator.Close()
	
	for ; iterator.Valid(); iterator.Next() {
		var entry types.RevocationEntry
		k.cdc.MustUnmarshal(iterator.Value(), &entry)
		
		if entry.CredentialID == credentialID && entry.Status == types.StatusRevoked {
			return true
		}
	}
	
	return false
}

// SubmitAppeal submits an appeal for a revocation
func (k Keeper) SubmitAppeal(ctx sdk.Context, revocationID string, appeal *types.Appeal) error {
	entry, err := k.GetRevocation(ctx, revocationID)
	if err != nil {
		return err
	}
	
	entry.Appeals = append(entry.Appeals, *appeal)
	
	store := ctx.KVStore(k.storeKey)
	bz := k.cdc.MustMarshal(entry)
	store.Set(types.RevocationKey(entry.ID), bz)
	
	return nil
}

// QueryRevocations returns revocations based on query parameters
func (k Keeper) QueryRevocations(ctx sdk.Context, query types.RevocationQuery) ([]*types.RevocationEntry, error) {
	store := ctx.KVStore(k.storeKey)
	iterator := store.Iterator(nil, nil)
	defer iterator.Close()
	
	var revocations []*types.RevocationEntry
	
	for ; iterator.Valid(); iterator.Next() {
		var entry types.RevocationEntry
		k.cdc.MustUnmarshal(iterator.Value(), &entry)
		
		// Apply query filters
		if query.Status != "" && entry.Status != types.RevocationStatus(query.Status) {
			continue
		}
		
		if query.CredentialID != "" && entry.CredentialID != query.CredentialID {
			continue
		}
		
		revocations = append(revocations, &entry)
	}
	
	return revocations, nil
}