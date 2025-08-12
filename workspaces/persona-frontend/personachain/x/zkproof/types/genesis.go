package types

import (
	"fmt"
)

// DefaultGenesis returns the default genesis state.
func DefaultGenesis() *GenesisState {
	return &GenesisState{
		Params:           DefaultParams(),
		Circuits:         []Circuit{},
		Proofs:           []ZKProof{},
		ProofRequests:    []ProofRequest{},
		CircuitCount:     0,
		ProofCount:       0,
		ProofRequestCount: 0,
		LastCircuitId:    "",
		LastProofId:      "",
		LastRequestId:    "",
	}
}

// Validate performs basic validation of genesis data.
func (gs GenesisState) Validate() error {
	// Validate parameters
	if err := gs.Params.Validate(); err != nil {
		return err
	}

	// Track unique IDs
	circuitIDs := make(map[string]bool)
	proofIDs := make(map[string]bool)
	requestIDs := make(map[string]bool)

	// Validate circuits
	for i, circuit := range gs.Circuits {
		if err := circuit.Validate(); err != nil {
			return fmt.Errorf("invalid circuit at index %d: %w", i, err)
		}

		if circuitIDs[circuit.Id] {
			return fmt.Errorf("duplicate circuit ID: %s", circuit.Id)
		}
		circuitIDs[circuit.Id] = true

		// Validate circuit timestamps
		if circuit.CreatedAt.IsZero() {
			return fmt.Errorf("circuit %s has zero created timestamp", circuit.Id)
		}
		if circuit.UpdatedAt.Before(circuit.CreatedAt) {
			return fmt.Errorf("circuit %s has update time before creation time", circuit.Id)
		}
	}

	// Validate proofs
	for i, proof := range gs.Proofs {
		if err := proof.Validate(); err != nil {
			return fmt.Errorf("invalid proof at index %d: %w", i, err)
		}

		if proofIDs[proof.Id] {
			return fmt.Errorf("duplicate proof ID: %s", proof.Id)
		}
		proofIDs[proof.Id] = true

		// Validate that referenced circuit exists
		if !circuitIDs[proof.CircuitId] {
			return fmt.Errorf("proof %s references non-existent circuit %s", proof.Id, proof.CircuitId)
		}

		// Validate proof timestamps
		if proof.CreatedAt.IsZero() {
			return fmt.Errorf("proof %s has zero created timestamp", proof.Id)
		}
		if proof.ValidFrom.IsZero() {
			return fmt.Errorf("proof %s has zero valid from timestamp", proof.Id)
		}
		if proof.ValidTo != nil && proof.ValidTo.Before(proof.ValidFrom) {
			return fmt.Errorf("proof %s has valid to time before valid from time", proof.Id)
		}
		if proof.UpdatedAt.Before(proof.CreatedAt) {
			return fmt.Errorf("proof %s has update time before creation time", proof.Id)
		}

		// Validate proof status
		switch proof.Status {
		case ProofStatusPending, ProofStatusValid, ProofStatusInvalid, ProofStatusExpired:
			// Valid status
		default:
			return fmt.Errorf("proof %s has invalid status: %s", proof.Id, proof.Status)
		}
	}

	// Validate proof requests
	for i, request := range gs.ProofRequests {
		if err := request.Validate(); err != nil {
			return fmt.Errorf("invalid proof request at index %d: %w", i, err)
		}

		if requestIDs[request.Id] {
			return fmt.Errorf("duplicate proof request ID: %s", request.Id)
		}
		requestIDs[request.Id] = true

		// Validate that referenced circuit exists
		if !circuitIDs[request.CircuitId] {
			return fmt.Errorf("proof request %s references non-existent circuit %s", request.Id, request.CircuitId)
		}

		// Validate request timestamps
		if request.CreatedAt.IsZero() {
			return fmt.Errorf("proof request %s has zero created timestamp", request.Id)
		}
		if request.Deadline.Before(request.CreatedAt) {
			return fmt.Errorf("proof request %s has deadline before creation time", request.Id)
		}

		// If proof is completed, validate proof exists
		if request.ProofId != "" {
			if !proofIDs[request.ProofId] {
				return fmt.Errorf("proof request %s references non-existent proof %s", request.Id, request.ProofId)
			}
			if request.CompletedAt.IsZero() {
				return fmt.Errorf("proof request %s is completed but has zero completion timestamp", request.Id)
			}
		}
	}

	// Validate counts
	if gs.CircuitCount != uint64(len(gs.Circuits)) {
		return fmt.Errorf("circuit count mismatch: expected %d, got %d", len(gs.Circuits), gs.CircuitCount)
	}
	if gs.ProofCount != uint64(len(gs.Proofs)) {
		return fmt.Errorf("proof count mismatch: expected %d, got %d", len(gs.Proofs), gs.ProofCount)
	}
	if gs.ProofRequestCount != uint64(len(gs.ProofRequests)) {
		return fmt.Errorf("proof request count mismatch: expected %d, got %d", len(gs.ProofRequests), gs.ProofRequestCount)
	}

	return nil
}

// GenesisState represents the genesis state for the zkproof module.
type GenesisState struct {
	// Module parameters
	Params Params `json:"params"`

	// All circuits
	Circuits []Circuit `json:"circuits"`

	// All proofs
	Proofs []ZKProof `json:"proofs"`

	// All proof requests
	ProofRequests []ProofRequest `json:"proof_requests"`

	// Counters
	CircuitCount      uint64 `json:"circuit_count"`
	ProofCount        uint64 `json:"proof_count"`
	ProofRequestCount uint64 `json:"proof_request_count"`

	// Last IDs for reference
	LastCircuitId string `json:"last_circuit_id"`
	LastProofId   string `json:"last_proof_id"`
	LastRequestId string `json:"last_request_id"`
}

// ProtoMessage implements proto.Message interface
func (*GenesisState) ProtoMessage() {}

// Reset implements proto.Message interface
func (gs *GenesisState) Reset() { *gs = GenesisState{} }

// String implements proto.Message interface
func (gs *GenesisState) String() string {
	return fmt.Sprintf("GenesisState{Circuits: %d, Proofs: %d, ProofRequests: %d}", len(gs.Circuits), len(gs.Proofs), len(gs.ProofRequests))
}