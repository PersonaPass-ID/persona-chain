package identity

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/PersonaPass-ID/persona-chain/x/identity/keeper"
	"github.com/PersonaPass-ID/persona-chain/x/identity/types"
)

// InitGenesis initializes the module's state from a provided genesis state.
func InitGenesis(ctx sdk.Context, k keeper.Keeper, genState types.GenesisState) {
	// Set module parameters
	k.SetParams(ctx, genState.Params)

	// Store all identities
	for _, identity := range genState.Identities {
		err := k.CreateIdentity(ctx, identity.Address, identity.DIDDocument)
		if err != nil {
			panic(err)
		}
	}

	// Store all credentials
	for _, credential := range genState.Credentials {
		// Store credential directly without going through IssueCredential
		// to preserve original IDs and timestamps
		store := ctx.KVStore(k.storeKey)
		credKey := types.GetCredentialKey(credential.ID)
		bz := k.cdc.MustMarshal(&credential)
		store.Set(credKey, bz)

		// Store credential ID index
		indexKey := types.GetCredentialIDIndexKey(credential.SubjectDID, credential.ID)
		store.Set(indexKey, []byte{0x01})
	}

	// Store all revocations
	for _, revocation := range genState.Revocations {
		store := ctx.KVStore(k.storeKey)
		revKey := types.GetRevocationKey(revocation.CredentialID)
		bz := k.cdc.MustMarshal(&revocation)
		store.Set(revKey, bz)
	}

	// Store all verifications
	for _, verification := range genState.Verifications {
		store := ctx.KVStore(k.storeKey)
		verKey := types.GetVerificationKey(verification.ID)
		bz := k.cdc.MustMarshal(&verification)
		store.Set(verKey, bz)
	}
}

// ExportGenesis returns the module's exported genesis
func ExportGenesis(ctx sdk.Context, k keeper.Keeper) *types.GenesisState {
	genesis := types.DefaultGenesis()
	genesis.Params = k.GetParams(ctx)

	store := ctx.KVStore(k.storeKey)

	// Export identities
	identityIterator := sdk.KVStorePrefixIterator(store, types.IdentityKeyPrefix)
	defer identityIterator.Close()
	for ; identityIterator.Valid(); identityIterator.Next() {
		var identity types.Identity
		k.cdc.MustUnmarshal(identityIterator.Value(), &identity)
		genesis.Identities = append(genesis.Identities, identity)
	}

	// Export credentials
	credentialIterator := sdk.KVStorePrefixIterator(store, types.CredentialKeyPrefix)
	defer credentialIterator.Close()
	for ; credentialIterator.Valid(); credentialIterator.Next() {
		var credential types.Credential
		k.cdc.MustUnmarshal(credentialIterator.Value(), &credential)
		genesis.Credentials = append(genesis.Credentials, credential)
	}

	// Export revocations
	revocationIterator := sdk.KVStorePrefixIterator(store, types.RevocationKeyPrefix)
	defer revocationIterator.Close()
	for ; revocationIterator.Valid(); revocationIterator.Next() {
		var revocation types.Revocation
		k.cdc.MustUnmarshal(revocationIterator.Value(), &revocation)
		genesis.Revocations = append(genesis.Revocations, revocation)
	}

	// Export verifications
	verificationIterator := sdk.KVStorePrefixIterator(store, types.VerificationKeyPrefix)
	defer verificationIterator.Close()
	for ; verificationIterator.Valid(); verificationIterator.Next() {
		var verification types.Verification
		k.cdc.MustUnmarshal(verificationIterator.Value(), &verification)
		genesis.Verifications = append(genesis.Verifications, verification)
	}

	return genesis
}