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
	
	"github.com/PersonaPass-ID/personachain/x/oracle/types"
)

// Keeper maintains the link to data storage and exposes getter/setter methods for the various parts of the state machine
type Keeper struct {
	cdc          codec.BinaryCodec
	storeService store.KVStoreService
	logger       log.Logger
	
	// External keepers
	authKeeper authkeeper.AccountKeeper
	bankKeeper bankkeeper.Keeper
	
	// Authority is the module authority
	authority string
}

// NewKeeper creates a new oracle Keeper instance
func NewKeeper(
	cdc codec.BinaryCodec,
	storeService store.KVStoreService,
	authority string,
	authKeeper authkeeper.AccountKeeper,
	bankKeeper bankkeeper.Keeper,
) *Keeper {
	return &Keeper{
		cdc:          cdc,
		storeService: storeService,
		logger:       log.NewNopLogger(),
		authKeeper:   authKeeper,
		bankKeeper:   bankKeeper,
		authority:    authority,
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

// RegisterOracle registers a new oracle
func (k Keeper) RegisterOracle(ctx sdk.Context, oracle *types.Oracle) error {
	if err := oracle.Validate(); err != nil {
		return err
	}
	
	store := k.storeService.OpenKVStore(ctx)
	bz := k.cdc.MustMarshal(oracle)
	store.Set(types.OracleKey(oracle.ID), bz)
	
	return nil
}

// GetOracle retrieves an oracle
func (k Keeper) GetOracle(ctx sdk.Context, oracleID string) (*types.Oracle, error) {
	store := k.storeService.OpenKVStore(ctx)
	bz, err := store.Get(types.OracleKey(oracleID))
	if err != nil {
		return nil, err
	}
	
	if bz == nil {
		return nil, types.ErrOracleNotFound
	}
	
	var oracle types.Oracle
	k.cdc.MustUnmarshal(bz, &oracle)
	
	return &oracle, nil
}

// SubmitOracleRequest submits a request to an oracle
func (k Keeper) SubmitOracleRequest(ctx sdk.Context, request *types.OracleRequest) error {
	if err := request.Validate(); err != nil {
		return err
	}
	
	// Verify oracle exists and is active
	oracle, err := k.GetOracle(ctx, request.OracleID)
	if err != nil {
		return err
	}
	
	if oracle.Status != types.StatusActive {
		return types.ErrOracleNotActive
	}
	
	store := k.storeService.OpenKVStore(ctx)
	bz := k.cdc.MustMarshal(request)
	store.Set(types.RequestKey(request.ID), bz)
	
	return nil
}

// GetOracleRequest retrieves an oracle request
func (k Keeper) GetOracleRequest(ctx sdk.Context, requestID string) (*types.OracleRequest, error) {
	store := k.storeService.OpenKVStore(ctx)
	bz := store.Get(types.RequestKey(requestID))
	
	if bz == nil {
		return nil, types.ErrRequestNotFound
	}
	
	var request types.OracleRequest
	k.cdc.MustUnmarshal(bz, &request)
	
	return &request, nil
}

// SubmitOracleResponse submits a response from an oracle
func (k Keeper) SubmitOracleResponse(ctx sdk.Context, response *types.OracleResponse) error {
	if err := response.Validate(); err != nil {
		return err
	}
	
	// Verify request exists
	request, err := k.GetOracleRequest(ctx, response.RequestID)
	if err != nil {
		return err
	}
	
	// Update request with response
	request.Response = response
	request.Status = types.RequestCompleted
	
	store := k.storeService.OpenKVStore(ctx)
	bz := k.cdc.MustMarshal(request)
	store.Set(types.RequestKey(request.ID), bz)
	
	return nil
}

// UpdateOracleStatistics updates oracle performance statistics
func (k Keeper) UpdateOracleStatistics(ctx sdk.Context, stats *types.OracleStatistics) error {
	store := k.storeService.OpenKVStore(ctx)
	bz := k.cdc.MustMarshal(stats)
	store.Set(types.StatsKey(stats.OracleID), bz)
	
	return nil
}

// GetOracleStatistics retrieves oracle statistics
func (k Keeper) GetOracleStatistics(ctx sdk.Context, oracleID string) (*types.OracleStatistics, error) {
	store := k.storeService.OpenKVStore(ctx)
	bz := store.Get(types.StatsKey(oracleID))
	
	if bz == nil {
		return nil, types.ErrStatsNotFound
	}
	
	var stats types.OracleStatistics
	k.cdc.MustUnmarshal(bz, &stats)
	
	return &stats, nil
}

// QueryOracles returns oracles based on query parameters
func (k Keeper) QueryOracles(ctx sdk.Context, query types.OracleQuery) ([]*types.Oracle, error) {
	store := k.storeService.OpenKVStore(ctx)
	iterator := store.Iterator(nil, nil)
	defer iterator.Close()
	
	var oracles []*types.Oracle
	
	for ; iterator.Valid(); iterator.Next() {
		var oracle types.Oracle
		k.cdc.MustUnmarshal(iterator.Value(), &oracle)
		
		// Apply query filters
		if query.Type != "" && oracle.Type != types.OracleType(query.Type) {
			continue
		}
		
		if query.Status != "" && oracle.Status != types.OracleStatus(query.Status) {
			continue
		}
		
		oracles = append(oracles, &oracle)
	}
	
	return oracles, nil
}