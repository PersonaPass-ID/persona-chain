package types

import (
	"fmt"
)

// DefaultIndex is the default global index
const DefaultIndex uint64 = 1

// DefaultGenesis returns the default genesis state
func DefaultGenesis() *GenesisState {
	return &GenesisState{
		Params:       DefaultParams(),
		Identities:   []Identity{},
		Credentials:  []Credential{},
		Revocations:  []Revocation{},
		Verifications: []Verification{},
	}
}

// Validate performs basic genesis state validation returning an error upon any
// failure.
func (gs GenesisState) Validate() error {
	// Check for duplicated identity addresses
	identityIndexMap := make(map[string]struct{})
	for _, elem := range gs.Identities {
		index := string(GetIdentityKey(elem.Address))
		if _, ok := identityIndexMap[index]; ok {
			return fmt.Errorf("duplicated identity address %s", elem.Address)
		}
		identityIndexMap[index] = struct{}{}
	}

	// Check for duplicated credential IDs
	credentialIndexMap := make(map[string]struct{})
	for _, elem := range gs.Credentials {
		index := string(GetCredentialKey(elem.ID))
		if _, ok := credentialIndexMap[index]; ok {
			return fmt.Errorf("duplicated credential ID %s", elem.ID)
		}
		credentialIndexMap[index] = struct{}{}
	}

	// Validate params
	return gs.Params.Validate()
}