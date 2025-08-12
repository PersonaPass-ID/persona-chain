package keeper

import (
	"context"
	"fmt"
	"time"

	"cosmossdk.io/core/store"
	storetypes "cosmossdk.io/store/types"
	"cosmossdk.io/log"
	
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	authkeeper "github.com/cosmos/cosmos-sdk/x/auth/keeper"
	bankkeeper "github.com/cosmos/cosmos-sdk/x/bank/keeper"
	
	"github.com/PersonaPass-ID/personachain/x/registry/types"
)

// Keeper maintains the link to data storage and exposes getter/setter methods for the various parts of the state machine
type Keeper struct {
	cdc          codec.BinaryCodec
	storeService store.KVStoreService
	logger       log.Logger

	// Keep reference to the auth and bank keepers
	authKeeper authkeeper.AccountKeeper
	bankKeeper bankkeeper.Keeper
	
	// Authority is the address capable of executing governance proposals
	authority string
}

// NewKeeper creates a registry keeper
func NewKeeper(
	cdc codec.BinaryCodec,
	storeService store.KVStoreService,
	logger log.Logger,
	authKeeper authkeeper.AccountKeeper,
	bankKeeper bankkeeper.Keeper,
	authority string,
) Keeper {
	return Keeper{
		cdc:          cdc,
		storeService: storeService,
		logger:       logger,
		authKeeper:   authKeeper,
		bankKeeper:   bankKeeper,
		authority:    authority,
	}
}

// Logger returns a module-specific logger.
func (k Keeper) Logger() log.Logger {
	return k.logger.With("module", "x/"+types.ModuleName)
}

// GetAuthority returns the authority address
func (k Keeper) GetAuthority() string {
	return k.authority
}

// RegisterIdentity registers a new identity in the global registry
func (k Keeper) RegisterIdentity(ctx context.Context, registry *types.IdentityRegistry) error {
	if err := registry.Validate(); err != nil {
		return err
	}

	// Check if identity already exists
	if k.HasIdentity(ctx, registry.ID) {
		return fmt.Errorf("identity %s already exists in registry", registry.ID)
	}

	// Set creation timestamp
	registry.Created = time.Now()
	registry.Updated = time.Now()
	registry.Status = types.StatusActive

	// Initialize reputation score
	registry.Reputation = types.ReputationScore{
		Overall:      50.0, // Start with neutral reputation
		Credentials:  50.0,
		Transactions: 50.0,
		Community:    50.0,
		Verification: 50.0,
		LastUpdated:  time.Now(),
	}

	return k.SetIdentity(ctx, registry)
}

// SetIdentity stores an identity registry entry
func (k Keeper) SetIdentity(ctx context.Context, registry *types.IdentityRegistry) error {
	store := k.storeService.OpenKVStore(ctx)
	
	bz, err := k.cdc.Marshal(registry)
	if err != nil {
		return err
	}
	
	store.Set(types.GetIdentityKey(registry.ID), bz)
	
	// Update indices
	k.setIdentityIndices(ctx, registry)
	
	return nil
}

// GetIdentity retrieves an identity from the registry
func (k Keeper) GetIdentity(ctx context.Context, id string) (*types.IdentityRegistry, error) {
	store := k.storeService.OpenKVStore(ctx)
	
	bz := store.Get(types.GetIdentityKey(id))
	if bz == nil {
		return nil, fmt.Errorf("identity %s not found in registry", id)
	}
	
	var registry types.IdentityRegistry
	if err := k.cdc.Unmarshal(bz, &registry); err != nil {
		return nil, err
	}
	
	return &registry, nil
}

// HasIdentity checks if an identity exists in the registry
func (k Keeper) HasIdentity(ctx context.Context, id string) bool {
	store := k.storeService.OpenKVStore(ctx)
	return store.Has(types.GetIdentityKey(id))
}

// UpdateIdentity updates an existing identity in the registry
func (k Keeper) UpdateIdentity(ctx context.Context, registry *types.IdentityRegistry) error {
	if !k.HasIdentity(ctx, registry.ID) {
		return fmt.Errorf("identity %s not found in registry", registry.ID)
	}

	// Update timestamp
	registry.Updated = time.Now()

	return k.SetIdentity(ctx, registry)
}

// SuspendIdentity suspends an identity in the registry
func (k Keeper) SuspendIdentity(ctx context.Context, id string, reason string) error {
	registry, err := k.GetIdentity(ctx, id)
	if err != nil {
		return err
	}

	registry.Status = types.StatusSuspended
	registry.Updated = time.Now()

	// Add reputation event
	event := types.ReputationEvent{
		Type:      "suspension",
		Impact:    -20.0,
		Reason:    reason,
		Source:    "system",
		Timestamp: time.Now(),
	}
	registry.Reputation.History = append(registry.Reputation.History, event)
	k.updateReputationScore(registry, event)

	return k.UpdateIdentity(ctx, registry)
}

// RevokeIdentity revokes an identity in the registry
func (k Keeper) RevokeIdentity(ctx context.Context, id string, reason string) error {
	registry, err := k.GetIdentity(ctx, id)
	if err != nil {
		return err
	}

	registry.Status = types.StatusRevoked
	registry.Updated = time.Now()

	// Add reputation event
	event := types.ReputationEvent{
		Type:      "revocation",
		Impact:    -50.0,
		Reason:    reason,
		Source:    "system",
		Timestamp: time.Now(),
	}
	registry.Reputation.History = append(registry.Reputation.History, event)
	k.updateReputationScore(registry, event)

	return k.UpdateIdentity(ctx, registry)
}

// UpdateReputation updates the reputation score of an identity
func (k Keeper) UpdateReputation(ctx context.Context, id string, event types.ReputationEvent) error {
	registry, err := k.GetIdentity(ctx, id)
	if err != nil {
		return err
	}

	registry.Reputation.History = append(registry.Reputation.History, event)
	k.updateReputationScore(registry, event)
	registry.Updated = time.Now()

	return k.UpdateIdentity(ctx, registry)
}

// QueryIdentities queries identities based on criteria
func (k Keeper) QueryIdentities(ctx context.Context, query types.RegistryQuery) ([]*types.IdentityRegistry, error) {
	store := k.storeService.OpenKVStore(ctx)
	var identities []*types.IdentityRegistry
	
	iterator := store.Iterator(types.IdentityPrefix, storetypes.PrefixEndBytes(types.IdentityPrefix))
	defer iterator.Close()

	count := uint64(0)
	for ; iterator.Valid(); iterator.Next() {
		if count < query.Offset {
			count++
			continue
		}
		
		if query.Limit > 0 && count >= query.Offset+query.Limit {
			break
		}

		var registry types.IdentityRegistry
		if err := k.cdc.Unmarshal(iterator.Value(), &registry); err != nil {
			continue
		}

		// Apply filters
		if k.matchesFilters(&registry, query.Filters) {
			identities = append(identities, &registry)
		}
		
		count++
	}

	return identities, nil
}

// GetStatistics returns registry statistics
func (k Keeper) GetStatistics(ctx context.Context) (*types.RegistryStatistics, error) {
	store := k.storeService.OpenKVStore(ctx)
	
	stats := &types.RegistryStatistics{
		ByType:         make(map[string]uint64),
		ByStatus:       make(map[string]uint64),
		ByJurisdiction: make(map[string]uint64),
		LastUpdated:    time.Now(),
	}

	var totalReputation float64
	var reputationCount uint64

	iterator := store.Iterator(types.IdentityPrefix, storetypes.PrefixEndBytes(types.IdentityPrefix))
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		var registry types.IdentityRegistry
		if err := k.cdc.Unmarshal(iterator.Value(), &registry); err != nil {
			continue
		}

		stats.TotalIdentities++
		
		// Count by status
		stats.ByStatus[string(registry.Status)]++
		if registry.Status == types.StatusActive {
			stats.ActiveIdentities++
		} else if registry.Status == types.StatusSuspended {
			stats.SuspendedIdentities++
		} else if registry.Status == types.StatusRevoked {
			stats.RevokedIdentities++
		}

		// Count by type
		stats.ByType[string(registry.Metadata.Type)]++

		// Count by jurisdiction
		if registry.Metadata.Jurisdiction != "" {
			stats.ByJurisdiction[registry.Metadata.Jurisdiction]++
		}

		// Calculate average reputation
		totalReputation += registry.Reputation.Overall
		reputationCount++
	}

	if reputationCount > 0 {
		stats.ReputationAverage = totalReputation / float64(reputationCount)
	}

	return stats, nil
}

// Helper functions

func (k Keeper) setIdentityIndices(ctx context.Context, registry *types.IdentityRegistry) {
	store := k.storeService.OpenKVStore(ctx)
	
	// Index by DID
	store.Set(types.GetDIDToRegistryKey(registry.DID), []byte(registry.ID))
	
	// Index by owner
	store.Set(types.GetOwnerToRegistryKey(registry.Owner), []byte(registry.ID))
	
	// Index by type
	store.Set(types.GetTypeIndexKey(string(registry.Metadata.Type), registry.ID), []byte{})
	
	// Index by status
	store.Set(types.GetStatusIndexKey(string(registry.Status), registry.ID), []byte{})
}

func (k Keeper) updateReputationScore(registry *types.IdentityRegistry, event types.ReputationEvent) {
	// Simple reputation update algorithm - can be enhanced
	registry.Reputation.Overall = max(0, min(100, registry.Reputation.Overall+event.Impact))
	
	switch event.Type {
	case "credential":
		registry.Reputation.Credentials = max(0, min(100, registry.Reputation.Credentials+event.Impact))
	case "transaction":
		registry.Reputation.Transactions = max(0, min(100, registry.Reputation.Transactions+event.Impact))
	case "community":
		registry.Reputation.Community = max(0, min(100, registry.Reputation.Community+event.Impact))
	case "verification":
		registry.Reputation.Verification = max(0, min(100, registry.Reputation.Verification+event.Impact))
	}
	
	registry.Reputation.LastUpdated = time.Now()
}

func (k Keeper) matchesFilters(registry *types.IdentityRegistry, filters map[string]interface{}) bool {
	// Simple filter matching - can be enhanced with complex query logic
	if len(filters) == 0 {
		return true
	}
	
	for key, value := range filters {
		switch key {
		case "status":
			if string(registry.Status) != value.(string) {
				return false
			}
		case "type":
			if string(registry.Metadata.Type) != value.(string) {
				return false
			}
		case "owner":
			if registry.Owner != value.(string) {
				return false
			}
		case "did":
			if registry.DID != value.(string) {
				return false
			}
		}
	}
	
	return true
}

func max(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}