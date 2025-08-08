package keeper

import (
	"cosmossdk.io/collections"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/personahq/personachain/x/zkproof/types"
)

// InitGenesis initializes the module's state from a provided genesis state.
func (k Keeper) InitGenesis(ctx sdk.Context, data types.GenesisState) {
	// Set parameters
	if err := k.SetParams(ctx, data.Params); err != nil {
		panic(err)
	}

	// Initialize counters
	if err := k.CircuitCount.Set(ctx, data.CircuitCount); err != nil {
		panic(err)
	}
	if err := k.ProofCount.Set(ctx, data.ProofCount); err != nil {
		panic(err)
	}
	if err := k.ProofRequestCount.Set(ctx, data.ProofRequestCount); err != nil {
		panic(err)
	}

	// Import circuits
	for _, circuit := range data.Circuits {
		if err := k.Circuits.Set(ctx, circuit.Id, circuit); err != nil {
			panic(err)
		}

		// Set creator index
		if err := k.CircuitsByCreator.Set(ctx, 
			collections.Join(circuit.Creator, circuit.Id), 
			circuit.Id); err != nil {
			panic(err)
		}
	}

	// Import proofs
	for _, proof := range data.Proofs {
		if err := k.Proofs.Set(ctx, proof.Id, proof); err != nil {
			panic(err)
		}

		// Set indexes
		if err := k.ProofsByProver.Set(ctx, 
			collections.Join(proof.Prover, proof.Id), 
			proof.Id); err != nil {
			panic(err)
		}

		if proof.Verifier != "" {
			if err := k.ProofsByVerifier.Set(ctx, 
				collections.Join(proof.Verifier, proof.Id), 
				proof.Id); err != nil {
				panic(err)
			}
		}

		if err := k.ProofsByCircuit.Set(ctx, 
			collections.Join(proof.CircuitId, proof.Id), 
			proof.Id); err != nil {
			panic(err)
		}

		if err := k.ProofsByStatus.Set(ctx, 
			collections.Join(string(proof.Status), proof.Id), 
			proof.Id); err != nil {
			panic(err)
		}

		if err := k.ProofsByType.Set(ctx, 
			collections.Join(string(proof.ProofType), proof.Id), 
			proof.Id); err != nil {
			panic(err)
		}
	}

	// Import proof requests
	for _, request := range data.ProofRequests {
		if err := k.ProofRequests.Set(ctx, request.Id, request); err != nil {
			panic(err)
		}
	}
}

// ExportGenesis returns the module's exported genesis state.
func (k Keeper) ExportGenesis(ctx sdk.Context) *types.GenesisState {
	params, err := k.GetParams(ctx)
	if err != nil {
		panic(err)
	}

	circuitCount, _ := k.CircuitCount.Get(ctx)
	proofCount, _ := k.ProofCount.Get(ctx)
	proofRequestCount, _ := k.ProofRequestCount.Get(ctx)

	// Export circuits
	circuits := k.GetAllCircuits(ctx)

	// Export proofs
	var proofs []types.ZKProof
	err = k.Proofs.Walk(ctx, nil, func(key string, proof types.ZKProof) (bool, error) {
		proofs = append(proofs, proof)
		return false, nil
	})
	if err != nil {
		panic(err)
	}

	// Export proof requests
	var requests []types.ProofRequest
	err = k.ProofRequests.Walk(ctx, nil, func(key string, request types.ProofRequest) (bool, error) {
		requests = append(requests, request)
		return false, nil
	})
	if err != nil {
		panic(err)
	}

	// Get last IDs for reference
	var lastCircuitId, lastProofId, lastRequestId string
	if len(circuits) > 0 {
		lastCircuitId = circuits[len(circuits)-1].Id
	}
	if len(proofs) > 0 {
		lastProofId = proofs[len(proofs)-1].Id
	}
	if len(requests) > 0 {
		lastRequestId = requests[len(requests)-1].Id
	}

	return &types.GenesisState{
		Params:            params,
		Circuits:          circuits,
		Proofs:            proofs,
		ProofRequests:     requests,
		CircuitCount:      circuitCount,
		ProofCount:        proofCount,
		ProofRequestCount: proofRequestCount,
		LastCircuitId:     lastCircuitId,
		LastProofId:       lastProofId,
		LastRequestId:     lastRequestId,
	}
}