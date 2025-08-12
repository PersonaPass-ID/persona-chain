package types

import "cosmossdk.io/collections"

const (
	// ModuleName defines the module name
	ModuleName = "zkproof"

	// StoreKey defines the primary module store key
	StoreKey = ModuleName

	// MemStoreKey defines the in-memory store key
	MemStoreKey = "mem_zkproof"
)

// Collections prefixes for type-safe storage
var (
	// Core storage prefixes
	CircuitPrefix         = collections.NewPrefix(1)
	ProofPrefix          = collections.NewPrefix(2)
	ProofRequestPrefix   = collections.NewPrefix(3)
	
	// Counter prefixes
	CircuitCountKey      = collections.NewPrefix(10)
	ProofCountKey        = collections.NewPrefix(11)
	ProofRequestCountKey = collections.NewPrefix(12)
	
	// Index prefixes
	CircuitsByCreatorPrefix  = collections.NewPrefix(20)
	ProofsByProverPrefix     = collections.NewPrefix(21)
	ProofsByVerifierPrefix   = collections.NewPrefix(22)
	ProofsByCircuitPrefix    = collections.NewPrefix(23)
	ProofsByStatusPrefix     = collections.NewPrefix(24)
	ProofsByTypePrefix       = collections.NewPrefix(25)
	
	// Parameter prefix
	ParamsKey = collections.NewPrefix(30)
)

// Key helper functions for legacy compatibility

// CircuitKey creates a store key for a circuit by ID
func CircuitKey(id string) []byte {
	return []byte("circuit/" + id)
}

// ProofKey creates a store key for a proof by ID
func ProofKey(id string) []byte {
	return []byte("proof/" + id)
}

// ProofRequestKey creates a store key for a proof request by ID
func ProofRequestKey(id string) []byte {
	return []byte("proof_request/" + id)
}

// CircuitByCreatorKey creates a store key for indexing circuits by creator
func CircuitByCreatorKey(creator, id string) []byte {
	return []byte("circuit_creator/" + creator + ":" + id)
}

// ProofByProverKey creates a store key for indexing proofs by prover
func ProofByProverKey(prover, id string) []byte {
	return []byte("proof_prover/" + prover + ":" + id)
}

// ProofByVerifierKey creates a store key for indexing proofs by verifier
func ProofByVerifierKey(verifier, id string) []byte {
	return []byte("proof_verifier/" + verifier + ":" + id)
}

// ProofByCircuitKey creates a store key for indexing proofs by circuit
func ProofByCircuitKey(circuitId, proofId string) []byte {
	return []byte("proof_circuit/" + circuitId + ":" + proofId)
}

// ProofByStatusKey creates a store key for indexing proofs by status
func ProofByStatusKey(status, id string) []byte {
	return []byte("proof_status/" + status + ":" + id)
}

// ProofByTypeKey creates a store key for indexing proofs by type
func ProofByTypeKey(proofType, id string) []byte {
	return []byte("proof_type/" + proofType + ":" + id)
}