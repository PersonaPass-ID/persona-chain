package keeper

import (
	"fmt"
	"time"

	"github.com/tendermint/tendermint/libs/log"

	"github.com/cosmos/cosmos-sdk/codec"
	storetypes "github.com/cosmos/cosmos-sdk/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
	paramtypes "github.com/cosmos/cosmos-sdk/x/params/types"

	"github.com/PersonaPass-ID/persona-chain/x/identity/types"
)

// Keeper of the identity store
type Keeper struct {
	cdc        codec.BinaryCodec
	storeKey   storetypes.StoreKey
	memKey     storetypes.StoreKey
	paramstore paramtypes.Subspace
}

// NewKeeper creates a new identity Keeper instance
func NewKeeper(
	cdc codec.BinaryCodec,
	storeKey,
	memKey storetypes.StoreKey,
	ps paramtypes.Subspace,
) *Keeper {
	// set KeyTable if it has not already been set
	if !ps.HasKeyTable() {
		ps = ps.WithKeyTable(types.ParamKeyTable())
	}

	return &Keeper{
		cdc:        cdc,
		storeKey:   storeKey,
		memKey:     memKey,
		paramstore: ps,
	}
}

// Logger returns a module-specific logger.
func (k Keeper) Logger(ctx sdk.Context) log.Logger {
	return ctx.Logger().With("module", fmt.Sprintf("x/%s", types.ModuleName))
}

// GetParams gets all parameters as types.Params
func (k Keeper) GetParams(ctx sdk.Context) types.Params {
	return types.NewParams(
		k.MaxCredentialsPerDID(ctx),
		k.CredentialFee(ctx),
		k.VerificationFee(ctx),
	)
}

// SetParams sets the params
func (k Keeper) SetParams(ctx sdk.Context, params types.Params) {
	k.paramstore.SetParamSet(ctx, &params)
}

// CreateIdentity creates a new DID for an address
func (k Keeper) CreateIdentity(ctx sdk.Context, address string, didDocument string) error {
	store := ctx.KVStore(k.storeKey)
	key := types.GetIdentityKey(address)

	// Check if identity already exists
	if store.Has(key) {
		return fmt.Errorf("identity already exists for address %s", address)
	}

	identity := types.Identity{
		Address:     address,
		DIDDocument: didDocument,
		CreatedAt:   ctx.BlockTime(),
		UpdatedAt:   ctx.BlockTime(),
	}

	bz := k.cdc.MustMarshal(&identity)
	store.Set(key, bz)

	// Emit event
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			types.EventTypeIdentityCreated,
			sdk.NewAttribute(types.AttributeKeyAddress, address),
			sdk.NewAttribute(types.AttributeKeyDID, didDocument),
		),
	)

	return nil
}

// GetIdentity retrieves an identity by address
func (k Keeper) GetIdentity(ctx sdk.Context, address string) (*types.Identity, error) {
	store := ctx.KVStore(k.storeKey)
	key := types.GetIdentityKey(address)

	bz := store.Get(key)
	if bz == nil {
		return nil, fmt.Errorf("identity not found for address %s", address)
	}

	var identity types.Identity
	k.cdc.MustUnmarshal(bz, &identity)
	return &identity, nil
}

// IssueCredential issues a new verifiable credential
func (k Keeper) IssueCredential(
	ctx sdk.Context,
	issuer string,
	subjectDID string,
	credentialType string,
	credentialData string,
	expiry int64,
) (string, error) {
	// Generate credential ID
	credentialID := fmt.Sprintf("cred_%s_%d", subjectDID, ctx.BlockHeight())

	credential := types.Credential{
		ID:             credentialID,
		Issuer:         issuer,
		SubjectDID:     subjectDID,
		CredentialType: credentialType,
		CredentialData: credentialData,
		IssuedAt:       ctx.BlockTime(),
		Expiry:         time.Unix(expiry, 0),
		Status:         "active",
	}

	// Store credential
	store := ctx.KVStore(k.storeKey)
	credKey := types.GetCredentialKey(credentialID)
	bz := k.cdc.MustMarshal(&credential)
	store.Set(credKey, bz)

	// Store credential ID index
	indexKey := types.GetCredentialIDIndexKey(subjectDID, credentialID)
	store.Set(indexKey, []byte{0x01})

	// Emit event
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			types.EventTypeCredentialIssued,
			sdk.NewAttribute(types.AttributeKeyCredentialID, credentialID),
			sdk.NewAttribute(types.AttributeKeyIssuer, issuer),
			sdk.NewAttribute(types.AttributeKeySubject, subjectDID),
		),
	)

	return credentialID, nil
}

// GetCredential retrieves a credential by ID
func (k Keeper) GetCredential(ctx sdk.Context, credentialID string) (*types.Credential, error) {
	store := ctx.KVStore(k.storeKey)
	key := types.GetCredentialKey(credentialID)

	bz := store.Get(key)
	if bz == nil {
		return nil, fmt.Errorf("credential not found: %s", credentialID)
	}

	var credential types.Credential
	k.cdc.MustUnmarshal(bz, &credential)
	return &credential, nil
}

// VerifyCredential verifies a credential with ZK proof
func (k Keeper) VerifyCredential(
	ctx sdk.Context,
	verifier string,
	credentialID string,
	proofData string,
) error {
	// Retrieve credential
	credential, err := k.GetCredential(ctx, credentialID)
	if err != nil {
		return err
	}

	// Check if credential is active
	if credential.Status != "active" {
		return fmt.Errorf("credential is not active: %s", credential.Status)
	}

	// Check expiry
	if ctx.BlockTime().After(credential.Expiry) {
		return fmt.Errorf("credential has expired")
	}

	// TODO: Implement actual ZK proof verification
	// For now, we just record the verification event

	verificationID := fmt.Sprintf("verify_%s_%d", credentialID, ctx.BlockHeight())
	verification := types.Verification{
		ID:           verificationID,
		Verifier:     verifier,
		CredentialID: credentialID,
		ProofData:    proofData,
		Verified:     true,
		VerifiedAt:   ctx.BlockTime(),
	}

	// Store verification record
	store := ctx.KVStore(k.storeKey)
	verKey := types.GetVerificationKey(verificationID)
	bz := k.cdc.MustMarshal(&verification)
	store.Set(verKey, bz)

	// Emit event
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			types.EventTypeCredentialVerified,
			sdk.NewAttribute(types.AttributeKeyCredentialID, credentialID),
			sdk.NewAttribute(types.AttributeKeyVerifier, verifier),
		),
	)

	return nil
}

// RevokeCredential revokes an issued credential
func (k Keeper) RevokeCredential(
	ctx sdk.Context,
	issuer string,
	credentialID string,
	reason string,
) error {
	// Retrieve credential
	credential, err := k.GetCredential(ctx, credentialID)
	if err != nil {
		return err
	}

	// Check if issuer matches
	if credential.Issuer != issuer {
		return fmt.Errorf("only the issuer can revoke a credential")
	}

	// Check if already revoked
	if credential.Status == "revoked" {
		return fmt.Errorf("credential is already revoked")
	}

	// Update credential status
	credential.Status = "revoked"
	store := ctx.KVStore(k.storeKey)
	credKey := types.GetCredentialKey(credentialID)
	bz := k.cdc.MustMarshal(&credential)
	store.Set(credKey, bz)

	// Store revocation record
	revocation := types.Revocation{
		CredentialID: credentialID,
		Issuer:       issuer,
		Reason:       reason,
		RevokedAt:    ctx.BlockTime(),
	}
	revKey := types.GetRevocationKey(credentialID)
	revBz := k.cdc.MustMarshal(&revocation)
	store.Set(revKey, revBz)

	// Emit event
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			types.EventTypeCredentialRevoked,
			sdk.NewAttribute(types.AttributeKeyCredentialID, credentialID),
			sdk.NewAttribute(types.AttributeKeyIssuer, issuer),
			sdk.NewAttribute(types.AttributeKeyReason, reason),
		),
	)

	return nil
}