package types

import (
	"fmt"
)

// GenesisState defines the credential module's genesis state.
type GenesisState struct {
	// Module parameters
	Params Params `json:"params"`
	
	// Credentials list
	Credentials []VerifiableCredential `json:"credentials"`
	
	// Presentations list  
	Presentations []VerifiablePresentation `json:"presentations"`
	
	// Credential count
	CredentialCount uint64 `json:"credentialCount"`
	
	// Presentation count
	PresentationCount uint64 `json:"presentationCount"`
}

// DefaultGenesis returns the default genesis state for the credential module.
func DefaultGenesis() *GenesisState {
	return &GenesisState{
		Params:            DefaultParams(),
		Credentials:       []VerifiableCredential{},
		Presentations:     []VerifiablePresentation{},
		CredentialCount:   0,
		PresentationCount: 0,
	}
}

// Validate validates the genesis state.
func (gs GenesisState) Validate() error {
	if err := gs.Params.Validate(); err != nil {
		return fmt.Errorf("invalid params: %w", err)
	}

	// Validate all credentials
	credentialIDs := make(map[string]bool)
	for _, credential := range gs.Credentials {
		if err := credential.Validate(); err != nil {
			return fmt.Errorf("invalid credential %s: %w", credential.ID, err)
		}
		
		// Check for duplicate IDs
		if credentialIDs[credential.ID] {
			return fmt.Errorf("duplicate credential ID: %s", credential.ID)
		}
		credentialIDs[credential.ID] = true
	}

	// Validate all presentations
	presentationIDs := make(map[string]bool)
	for _, presentation := range gs.Presentations {
		if err := presentation.Validate(); err != nil {
			return fmt.Errorf("invalid presentation %s: %w", presentation.ID, err)
		}
		
		// Check for duplicate IDs
		if presentationIDs[presentation.ID] {
			return fmt.Errorf("duplicate presentation ID: %s", presentation.ID)
		}
		presentationIDs[presentation.ID] = true
		
		// Check that referenced credentials exist
		for _, credID := range presentation.VerifiableCredential {
			if !credentialIDs[credID] {
				return fmt.Errorf("presentation %s references non-existent credential %s", presentation.ID, credID)
			}
		}
	}

	// Validate counts
	if gs.CredentialCount != uint64(len(gs.Credentials)) {
		return fmt.Errorf("credential count mismatch: expected %d, got %d", len(gs.Credentials), gs.CredentialCount)
	}
	
	if gs.PresentationCount != uint64(len(gs.Presentations)) {
		return fmt.Errorf("presentation count mismatch: expected %d, got %d", len(gs.Presentations), gs.PresentationCount)
	}

	return nil
}

// Implement proto.Message interface for GenesisState
func (m *GenesisState) ProtoMessage()  {}
func (m *GenesisState) Reset()         { *m = GenesisState{} }
func (m *GenesisState) String() string { return fmt.Sprintf("GenesisState{Params: %v, Credentials: %d, Presentations: %d}", m.Params, len(m.Credentials), len(m.Presentations)) }