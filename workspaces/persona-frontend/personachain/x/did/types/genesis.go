package types

import (
	"fmt"
)

// DefaultGenesis returns the default genesis state
func DefaultGenesis() *GenesisState {
	return &GenesisState{
		Params:   DefaultParams(),
		DIDs:     []DIDDocument{},
		DIDCount: 0,
	}
}

// Validate performs basic genesis state validation
func (gs GenesisState) Validate() error {
	// Validate parameters
	if err := gs.Params.Validate(); err != nil {
		return fmt.Errorf("invalid params: %w", err)
	}

	// Validate DID count matches actual DID list length
	if len(gs.DIDs) != int(gs.DIDCount) {
		return fmt.Errorf("DID count mismatch: expected %d, got %d", gs.DIDCount, len(gs.DIDs))
	}

	// Validate each DID
	didIDs := make(map[string]bool)
	for i, did := range gs.DIDs {
		// Check for duplicate DID IDs
		if didIDs[did.ID] {
			return fmt.Errorf("duplicate DID ID at index %d: %s", i, did.ID)
		}
		didIDs[did.ID] = true

		// Validate DID document
		if err := did.Validate(); err != nil {
			return fmt.Errorf("invalid DID document at index %d: %w", i, err)
		}
	}

	return nil
}

// GenesisState defines the DID module's genesis state
type GenesisState struct {
	// Params defines the module parameters
	Params Params `json:"params"`
	
	// DIDs defines the list of DID documents
	DIDs []DIDDocument `json:"dids"`
	
	// DIDCount defines the total count of DIDs
	DIDCount uint64 `json:"did_count"`
}

// Ensure GenesisState implements proto.Message interface for SDK compatibility
func (m *GenesisState) Reset()         { *m = GenesisState{} }
func (m *GenesisState) String() string { return fmt.Sprintf("%+v", *m) }
func (m *GenesisState) ProtoMessage()  {}