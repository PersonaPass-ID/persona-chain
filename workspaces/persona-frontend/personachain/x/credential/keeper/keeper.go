package keeper

import (
	"context"
	"fmt"

	"cosmossdk.io/collections"
	"cosmossdk.io/core/store"
	"cosmossdk.io/log"

	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/PersonaPass-ID/personachain/x/credential/types"
)

type Keeper struct {
	cdc          codec.BinaryCodec
	storeService store.KVStoreService
	authority    string

	// Collections for type-safe storage following cheqd patterns
	Schema collections.Schema

	// Core credential storage
	Credentials       collections.Map[string, types.VerifiableCredential]
	CredentialCount   collections.Item[uint64]
	PresentationCount collections.Item[uint64]

	// Indexing for efficient queries
	CredentialsByIssuer collections.Map[collections.Pair[string, string], string] // issuer -> credential_id
	CredentialsByHolder collections.Map[collections.Pair[string, string], string] // holder -> credential_id
	CredentialsByType   collections.Map[collections.Pair[string, string], string] // type -> credential_id

	// Presentations
	Presentations collections.Map[string, types.VerifiablePresentation]

	// Parameters
	Params collections.Item[types.Params]

	// Expected keepers
	accountKeeper types.AccountKeeper
	bankKeeper    types.BankKeeper
}

func NewKeeper(
	cdc codec.BinaryCodec,
	storeService store.KVStoreService,
	authority string,
	accountKeeper types.AccountKeeper,
	bankKeeper types.BankKeeper,
) *Keeper {
	sb := collections.NewSchemaBuilder(storeService)

	k := &Keeper{
		cdc:           cdc,
		storeService:  storeService,
		authority:     authority,
		accountKeeper: accountKeeper,
		bankKeeper:    bankKeeper,

		// Initialize collections
		Credentials:       collections.NewMap(sb, types.CredentialPrefix, "credentials", collections.StringKey, codec.CollValue[types.VerifiableCredential](cdc)),
		CredentialCount:   collections.NewItem(sb, types.CredentialCountKey, "credential_count", collections.Uint64Value),
		PresentationCount: collections.NewItem(sb, types.PresentationCountKey, "presentation_count", collections.Uint64Value),

		// Indexes
		CredentialsByIssuer: collections.NewMap(sb, types.CredentialByIssuerPrefix, "credentials_by_issuer", collections.PairKeyCodec(collections.StringKey, collections.StringKey), collections.StringValue),
		CredentialsByHolder: collections.NewMap(sb, types.CredentialByHolderPrefix, "credentials_by_holder", collections.PairKeyCodec(collections.StringKey, collections.StringKey), collections.StringValue),
		CredentialsByType:   collections.NewMap(sb, types.CredentialByTypePrefix, "credentials_by_type", collections.PairKeyCodec(collections.StringKey, collections.StringKey), collections.StringValue),

		Presentations: collections.NewMap(sb, types.PresentationPrefix, "presentations", collections.StringKey, codec.CollValue[types.VerifiablePresentation](cdc)),

		// Parameters
		Params: collections.NewItem(sb, types.ParamsKey, "params", codec.CollValue[types.Params](cdc)),
	}

	schema, err := sb.Build()
	if err != nil {
		panic(err)
	}
	k.Schema = schema

	return k
}

// GetAuthority returns the module's authority.
func (k Keeper) GetAuthority() string {
	return k.authority
}

// Logger returns a module-specific logger.
func (k Keeper) Logger(ctx context.Context) log.Logger {
	sdkCtx := sdk.UnwrapSDKContext(ctx)
	return sdkCtx.Logger().With("module", fmt.Sprintf("x/%s", types.ModuleName))
}

// GetParams returns the module parameters.
func (k Keeper) GetParams(ctx context.Context) (types.Params, error) {
	params, err := k.Params.Get(ctx)
	if err != nil {
		return types.Params{}, err
	}
	return params, nil
}

// SetParams sets the module parameters.
func (k Keeper) SetParams(ctx context.Context, params types.Params) error {
	return k.Params.Set(ctx, params)
}

// GetCredentialCount returns the current credential count.
func (k Keeper) GetCredentialCount(ctx context.Context) uint64 {
	count, err := k.CredentialCount.Get(ctx)
	if err != nil {
		return 0
	}
	return count
}

// SetCredentialCount sets the credential count.
func (k Keeper) SetCredentialCount(ctx context.Context, count uint64) error {
	return k.CredentialCount.Set(ctx, count)
}

// GetStoreKey returns the KVStoreKey for the provided store key.
func (k Keeper) GetStoreKey() store.KVStoreService {
	return k.storeService
}

// GetCodec returns the codec.
func (k Keeper) GetCodec() codec.BinaryCodec {
	return k.cdc
}

// CreateCredential creates a new verifiable credential.
func (k Keeper) CreateCredential(ctx context.Context, credential types.VerifiableCredential) error {
	// Validate credential
	if err := credential.Validate(); err != nil {
		return err
	}

	// Check if credential already exists
	exists, err := k.Credentials.Has(ctx, credential.ID)
	if err != nil {
		return err
	}
	if exists {
		return types.ErrCredentialAlreadyExists
	}

	// Store credential
	if err := k.Credentials.Set(ctx, credential.ID, credential); err != nil {
		return err
	}

	// Update indexes
	issuerKey := collections.Join(credential.Issuer, credential.ID)
	if err := k.CredentialsByIssuer.Set(ctx, issuerKey, credential.ID); err != nil {
		return err
	}

	holderKey := collections.Join(credential.CredentialSubject.ID, credential.ID)
	if err := k.CredentialsByHolder.Set(ctx, holderKey, credential.ID); err != nil {
		return err
	}

	// Update type indexes
	for _, credType := range credential.Type {
		typeKey := collections.Join(credType, credential.ID)
		if err := k.CredentialsByType.Set(ctx, typeKey, credential.ID); err != nil {
			return err
		}
	}

	// Increment count
	count := k.GetCredentialCount(ctx)
	return k.SetCredentialCount(ctx, count+1)
}

// GetCredential retrieves a credential by ID.
func (k Keeper) GetCredential(ctx context.Context, id string) (types.VerifiableCredential, error) {
	return k.Credentials.Get(ctx, id)
}

// GetAllCredentials returns all credentials.
func (k Keeper) GetAllCredentials(ctx context.Context) []types.VerifiableCredential {
	var credentials []types.VerifiableCredential
	err := k.Credentials.Walk(ctx, nil, func(key string, credential types.VerifiableCredential) (bool, error) {
		credentials = append(credentials, credential)
		return false, nil
	})
	if err != nil {
		return nil
	}
	return credentials
}

// RevokeCredential revokes a credential.
func (k Keeper) RevokeCredential(ctx context.Context, id string, revoker string) error {
	credential, err := k.GetCredential(ctx, id)
	if err != nil {
		return err
	}

	// Check if the revoker is authorized (issuer or subject)
	if credential.Issuer != revoker && credential.CredentialSubject.ID != revoker {
		return types.ErrUnauthorized
	}

	// Mark as revoked
	credential.Revoked = true
	now := sdk.UnwrapSDKContext(ctx).BlockTime()
	credential.RevokedAt = &now
	credential.Updated = now

	return k.Credentials.Set(ctx, id, credential)
}

// CreatePresentation creates a verifiable presentation.
func (k Keeper) CreatePresentation(ctx context.Context, presentation types.VerifiablePresentation) error {
	if err := presentation.Validate(); err != nil {
		return err
	}

	// Verify all credentials in the presentation exist and are valid
	for _, credID := range presentation.VerifiableCredential {
		credential, err := k.GetCredential(ctx, credID)
		if err != nil {
			return fmt.Errorf("credential %s not found: %w", credID, err)
		}

		if credential.Revoked {
			return fmt.Errorf("credential %s is revoked", credID)
		}

		if credential.IsExpired() {
			return fmt.Errorf("credential %s is expired", credID)
		}
	}

	// Store presentation
	if err := k.Presentations.Set(ctx, presentation.ID, presentation); err != nil {
		return err
	}

	// Increment presentation count
	count, _ := k.PresentationCount.Get(ctx)
	return k.PresentationCount.Set(ctx, count+1)
}

// GetPresentation retrieves a presentation by ID.
func (k Keeper) GetPresentation(ctx context.Context, id string) (types.VerifiablePresentation, error) {
	return k.Presentations.Get(ctx, id)
}

// GetCredentialsByIssuer returns all credentials issued by a specific issuer.
func (k Keeper) GetCredentialsByIssuer(ctx context.Context, issuer string) []types.VerifiableCredential {
	var credentials []types.VerifiableCredential
	rng := collections.NewPrefixedPairRange[string, string](issuer)
	
	err := k.CredentialsByIssuer.Walk(ctx, rng, func(key collections.Pair[string, string], credID string) (bool, error) {
		credential, err := k.GetCredential(ctx, credID)
		if err != nil {
			return true, err
		}
		credentials = append(credentials, credential)
		return false, nil
	})
	
	if err != nil {
		return nil
	}
	return credentials
}

// GetCredentialsByHolder returns all credentials held by a specific holder.
func (k Keeper) GetCredentialsByHolder(ctx context.Context, holder string) []types.VerifiableCredential {
	var credentials []types.VerifiableCredential
	rng := collections.NewPrefixedPairRange[string, string](holder)
	
	err := k.CredentialsByHolder.Walk(ctx, rng, func(key collections.Pair[string, string], credID string) (bool, error) {
		credential, err := k.GetCredential(ctx, credID)
		if err != nil {
			return true, err
		}
		credentials = append(credentials, credential)
		return false, nil
	})
	
	if err != nil {
		return nil
	}
	return credentials
}