package keeper

import (
	"cosmossdk.io/collections"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/PersonaPass-ID/personachain/x/zkproof/types"
)

// RegisterInvariants registers the zkproof module invariants.
func RegisterInvariants(ir sdk.InvariantRegistry, k Keeper) {
	ir.RegisterRoute(types.ModuleName, "circuit-count", CircuitCountInvariant(k))
	ir.RegisterRoute(types.ModuleName, "proof-count", ProofCountInvariant(k))
	ir.RegisterRoute(types.ModuleName, "proof-request-count", ProofRequestCountInvariant(k))
	ir.RegisterRoute(types.ModuleName, "circuit-creator-index", CircuitCreatorIndexInvariant(k))
	ir.RegisterRoute(types.ModuleName, "proof-prover-index", ProofProverIndexInvariant(k))
	ir.RegisterRoute(types.ModuleName, "proof-verifier-index", ProofVerifierIndexInvariant(k))
	ir.RegisterRoute(types.ModuleName, "proof-circuit-index", ProofCircuitIndexInvariant(k))
	ir.RegisterRoute(types.ModuleName, "proof-status-index", ProofStatusIndexInvariant(k))
	ir.RegisterRoute(types.ModuleName, "proof-type-index", ProofTypeIndexInvariant(k))
	ir.RegisterRoute(types.ModuleName, "circuit-references", CircuitReferencesInvariant(k))
	ir.RegisterRoute(types.ModuleName, "proof-validity", ProofValidityInvariant(k))
}

// CircuitCountInvariant checks that the circuit count matches the actual number of circuits.
func CircuitCountInvariant(k Keeper) sdk.Invariant {
	return func(ctx sdk.Context) (string, bool) {
		count, _ := k.CircuitCount.Get(ctx)
		actualCount := uint64(0)
		
		k.Circuits.Walk(ctx, nil, func(key string, circuit types.Circuit) (bool, error) {
			actualCount++
			return false, nil
		})
		
		broken := count != actualCount
		return sdk.FormatInvariant(types.ModuleName, "circuit count",
			"circuit count should match actual circuits"), broken
	}
}

// ProofCountInvariant checks that the proof count matches the actual number of proofs.
func ProofCountInvariant(k Keeper) sdk.Invariant {
	return func(ctx sdk.Context) (string, bool) {
		count, _ := k.ProofCount.Get(ctx)
		actualCount := uint64(0)
		
		k.Proofs.Walk(ctx, nil, func(key string, proof types.ZKProof) (bool, error) {
			actualCount++
			return false, nil
		})
		
		broken := count != actualCount
		return sdk.FormatInvariant(types.ModuleName, "proof count",
			"proof count should match actual proofs"), broken
	}
}

// ProofRequestCountInvariant checks that the proof request count matches the actual number of requests.
func ProofRequestCountInvariant(k Keeper) sdk.Invariant {
	return func(ctx sdk.Context) (string, bool) {
		count, _ := k.ProofRequestCount.Get(ctx)
		actualCount := uint64(0)
		
		k.ProofRequests.Walk(ctx, nil, func(key string, request types.ProofRequest) (bool, error) {
			actualCount++
			return false, nil
		})
		
		broken := count != actualCount
		return sdk.FormatInvariant(types.ModuleName, "proof request count",
			"proof request count should match actual requests"), broken
	}
}

// CircuitCreatorIndexInvariant checks the integrity of the circuit-by-creator index.
func CircuitCreatorIndexInvariant(k Keeper) sdk.Invariant {
	return func(ctx sdk.Context) (string, bool) {
		broken := false
		
		// Check that every circuit has a corresponding index entry
		k.Circuits.Walk(ctx, nil, func(key string, circuit types.Circuit) (bool, error) {
			indexKey := collections.Join(circuit.Creator, circuit.Id)
			has, _ := k.CircuitsByCreator.Has(ctx, indexKey)
			if !has {
				broken = true
			}
			return broken, nil
		})
		
		return sdk.FormatInvariant(types.ModuleName, "circuit creator index",
			"every circuit should have a creator index entry"), broken
	}
}

// ProofProverIndexInvariant checks the integrity of the proof-by-prover index.
func ProofProverIndexInvariant(k Keeper) sdk.Invariant {
	return func(ctx sdk.Context) (string, bool) {
		broken := false
		
		k.Proofs.Walk(ctx, nil, func(key string, proof types.ZKProof) (bool, error) {
			indexKey := collections.Join(proof.Prover, proof.Id)
			has, _ := k.ProofsByProver.Has(ctx, indexKey)
			if !has {
				broken = true
			}
			return broken, nil
		})
		
		return sdk.FormatInvariant(types.ModuleName, "proof prover index",
			"every proof should have a prover index entry"), broken
	}
}

// ProofVerifierIndexInvariant checks the integrity of the proof-by-verifier index.
func ProofVerifierIndexInvariant(k Keeper) sdk.Invariant {
	return func(ctx sdk.Context) (string, bool) {
		broken := false
		
		k.Proofs.Walk(ctx, nil, func(key string, proof types.ZKProof) (bool, error) {
			if proof.Verifier != "" {
				indexKey := collections.Join(proof.Verifier, proof.Id)
				has, _ := k.ProofsByVerifier.Has(ctx, indexKey)
				if !has {
					broken = true
				}
			}
			return broken, nil
		})
		
		return sdk.FormatInvariant(types.ModuleName, "proof verifier index",
			"every proof with verifier should have a verifier index entry"), broken
	}
}

// ProofCircuitIndexInvariant checks the integrity of the proof-by-circuit index.
func ProofCircuitIndexInvariant(k Keeper) sdk.Invariant {
	return func(ctx sdk.Context) (string, bool) {
		broken := false
		
		k.Proofs.Walk(ctx, nil, func(key string, proof types.ZKProof) (bool, error) {
			indexKey := collections.Join(proof.CircuitId, proof.Id)
			has, _ := k.ProofsByCircuit.Has(ctx, indexKey)
			if !has {
				broken = true
			}
			return broken, nil
		})
		
		return sdk.FormatInvariant(types.ModuleName, "proof circuit index",
			"every proof should have a circuit index entry"), broken
	}
}

// ProofStatusIndexInvariant checks the integrity of the proof-by-status index.
func ProofStatusIndexInvariant(k Keeper) sdk.Invariant {
	return func(ctx sdk.Context) (string, bool) {
		broken := false
		
		k.Proofs.Walk(ctx, nil, func(key string, proof types.ZKProof) (bool, error) {
			indexKey := collections.Join(string(proof.Status), proof.Id)
			has, _ := k.ProofsByStatus.Has(ctx, indexKey)
			if !has {
				broken = true
			}
			return broken, nil
		})
		
		return sdk.FormatInvariant(types.ModuleName, "proof status index",
			"every proof should have a status index entry"), broken
	}
}

// ProofTypeIndexInvariant checks the integrity of the proof-by-type index.
func ProofTypeIndexInvariant(k Keeper) sdk.Invariant {
	return func(ctx sdk.Context) (string, bool) {
		broken := false
		
		k.Proofs.Walk(ctx, nil, func(key string, proof types.ZKProof) (bool, error) {
			indexKey := collections.Join(string(proof.ProofType), proof.Id)
			has, _ := k.ProofsByType.Has(ctx, indexKey)
			if !has {
				broken = true
			}
			return broken, nil
		})
		
		return sdk.FormatInvariant(types.ModuleName, "proof type index",
			"every proof should have a type index entry"), broken
	}
}

// CircuitReferencesInvariant checks that all proof circuit references are valid.
func CircuitReferencesInvariant(k Keeper) sdk.Invariant {
	return func(ctx sdk.Context) (string, bool) {
		broken := false
		
		k.Proofs.Walk(ctx, nil, func(key string, proof types.ZKProof) (bool, error) {
			has, _ := k.Circuits.Has(ctx, proof.CircuitId)
			if !has {
				broken = true
			}
			return broken, nil
		})
		
		k.ProofRequests.Walk(ctx, nil, func(key string, request types.ProofRequest) (bool, error) {
			has, _ := k.Circuits.Has(ctx, request.CircuitId)
			if !has {
				broken = true
			}
			return broken, nil
		})
		
		return sdk.FormatInvariant(types.ModuleName, "circuit references",
			"all circuit references should be valid"), broken
	}
}

// ProofValidityInvariant checks proof validity constraints.
func ProofValidityInvariant(k Keeper) sdk.Invariant {
	return func(ctx sdk.Context) (string, bool) {
		broken := false
		
		k.Proofs.Walk(ctx, nil, func(key string, proof types.ZKProof) (bool, error) {
			// Check that valid from is not after valid to
			if proof.ValidTo != nil && proof.ValidFrom.After(*proof.ValidTo) {
				broken = true
				return broken, nil
			}
			
			// Check that creation timestamp is not after valid from
			if proof.CreatedAt.After(proof.ValidFrom) {
				broken = true
				return broken, nil
			}
			
			return broken, nil
		})
		
		return sdk.FormatInvariant(types.ModuleName, "proof validity",
			"proof validity periods should be consistent"), broken
	}
}