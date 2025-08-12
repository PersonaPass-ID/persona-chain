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
	
	"github.com/PersonaPass-ID/personachain/x/schema/types"
)

// Keeper maintains the link to data storage and exposes getter/setter methods for the various parts of the state machine
type Keeper struct {
	cdc      codec.BinaryCodec
	storeKey storetypes.StoreKey
	logger   log.Logger
	
	// External keepers
	authKeeper authkeeper.AccountKeeper
	bankKeeper bankkeeper.Keeper
	
	// Authority is the module authority
	authority string
}

// NewKeeper creates a new schema Keeper instance
func NewKeeper(
	cdc codec.BinaryCodec,
	storeService store.KVStoreService,
	authority string,
	authKeeper authkeeper.AccountKeeper,
	bankKeeper bankkeeper.Keeper,
) *Keeper {
	return &Keeper{
		cdc:        cdc,
		storeKey:   storeService.OpenKVStore(context.Background()),
		logger:     log.NewNopLogger(),
		authKeeper: authKeeper,
		bankKeeper: bankKeeper,
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

// SetSchema stores a credential schema
func (k Keeper) SetSchema(ctx sdk.Context, schema *types.CredentialSchema) error {
	if err := schema.Validate(); err != nil {
		return err
	}
	
	store := ctx.KVStore(k.storeKey)
	bz := k.cdc.MustMarshal(schema)
	store.Set(types.SchemaKey(schema.ID), bz)
	
	return nil
}

// GetSchema retrieves a credential schema
func (k Keeper) GetSchema(ctx sdk.Context, schemaID string) (*types.CredentialSchema, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(types.SchemaKey(schemaID))
	
	if bz == nil {
		return nil, types.ErrSchemaNotFound
	}
	
	var schema types.CredentialSchema
	k.cdc.MustUnmarshal(bz, &schema)
	
	return &schema, nil
}

// DeleteSchema removes a credential schema
func (k Keeper) DeleteSchema(ctx sdk.Context, schemaID string) error {
	store := ctx.KVStore(k.storeKey)
	key := types.SchemaKey(schemaID)
	
	if !store.Has(key) {
		return types.ErrSchemaNotFound
	}
	
	store.Delete(key)
	return nil
}

// QuerySchemas returns schemas based on query parameters
func (k Keeper) QuerySchemas(ctx sdk.Context, query types.SchemaQuery) ([]*types.CredentialSchema, error) {
	store := ctx.KVStore(k.storeKey)
	iterator := store.Iterator(nil, nil)
	defer iterator.Close()
	
	var schemas []*types.CredentialSchema
	
	for ; iterator.Valid(); iterator.Next() {
		var schema types.CredentialSchema
		k.cdc.MustUnmarshal(iterator.Value(), &schema)
		
		// Apply query filters
		if query.SchemaType != "" && schema.Schema.Type != query.SchemaType {
			continue
		}
		
		if query.Version != "" && schema.Version != query.Version {
			continue
		}
		
		schemas = append(schemas, &schema)
	}
	
	return schemas, nil
}