package keeper

import (
	"context"

	"cosmossdk.io/collections"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/personahq/personachain/x/zkproof/types"
)

var _ types.QueryServer = queryServer{}

type queryServer struct {
	Keeper
}

// NewQueryServerImpl returns an implementation of the QueryServer interface.
func NewQueryServerImpl(keeper Keeper) types.QueryServer {
	return &queryServer{Keeper: keeper}
}

// Params returns the module parameters.
func (k queryServer) Params(goCtx context.Context, req *types.QueryParamsRequest) (*types.QueryParamsResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	params, err := k.GetParams(goCtx)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &types.QueryParamsResponse{Params: params}, nil
}

// Circuit returns a specific circuit by ID.
func (k queryServer) Circuit(goCtx context.Context, req *types.QueryCircuitRequest) (*types.QueryCircuitResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	if req.CircuitId == "" {
		return nil, status.Error(codes.InvalidArgument, "circuit ID cannot be empty")
	}

	circuit, err := k.GetCircuit(goCtx, req.CircuitId)
	if err != nil {
		return nil, status.Error(codes.NotFound, "circuit not found")
	}

	return &types.QueryCircuitResponse{Circuit: circuit}, nil
}

// Circuits returns all circuits with optional filtering.
func (k queryServer) Circuits(goCtx context.Context, req *types.QueryCircuitsRequest) (*types.QueryCircuitsResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	var circuits []types.Circuit

	if req.Creator != "" {
		// Filter by creator
		rng := collections.NewPrefixedPairRange[string, string](req.Creator)
		err := k.CircuitsByCreator.Walk(goCtx, rng, func(key collections.Pair[string, string], circuitID string) (bool, error) {
			circuit, err := k.GetCircuit(goCtx, circuitID)
			if err != nil {
				return true, err
			}
			circuits = append(circuits, circuit)
			return false, nil
		})
		if err != nil {
			return nil, status.Error(codes.Internal, err.Error())
		}
	} else {
		// Get all circuits
		circuits = k.GetAllCircuits(goCtx)
	}

	return &types.QueryCircuitsResponse{Circuits: circuits}, nil
}

// Proof returns a specific proof by ID.
func (k queryServer) Proof(goCtx context.Context, req *types.QueryProofRequest) (*types.QueryProofResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	if req.ProofId == "" {
		return nil, status.Error(codes.InvalidArgument, "proof ID cannot be empty")
	}

	proof, err := k.GetProof(goCtx, req.ProofId)
	if err != nil {
		return nil, status.Error(codes.NotFound, "proof not found")
	}

	return &types.QueryProofResponse{Proof: proof}, nil
}

// Proofs returns proofs with optional filtering.
func (k queryServer) Proofs(goCtx context.Context, req *types.QueryProofsRequest) (*types.QueryProofsResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	var proofs []types.ZKProof

	if req.Prover != "" {
		// Filter by prover
		proofs = k.GetProofsByProver(goCtx, req.Prover)
	} else if req.Status != "" {
		// Filter by status
		proofs = k.GetProofsByStatus(goCtx, types.ProofStatus(req.Status))
	} else if req.CircuitId != "" {
		// Filter by circuit
		var proofList []types.ZKProof
		rng := collections.NewPrefixedPairRange[string, string](req.CircuitId)
		
		err := k.ProofsByCircuit.Walk(goCtx, rng, func(key collections.Pair[string, string], proofID string) (bool, error) {
			proof, err := k.GetProof(goCtx, proofID)
			if err != nil {
				return true, err
			}
			proofList = append(proofList, proof)
			return false, nil
		})
		
		if err != nil {
			return nil, status.Error(codes.Internal, err.Error())
		}
		proofs = proofList
	} else {
		// Get all proofs
		err := k.Keeper.Proofs.Walk(goCtx, nil, func(key string, proof types.ZKProof) (bool, error) {
			proofs = append(proofs, proof)
			return false, nil
		})
		if err != nil {
			return nil, status.Error(codes.Internal, err.Error())
		}
	}

	return &types.QueryProofsResponse{Proofs: proofs}, nil
}

// ProofRequest returns a specific proof request by ID.
func (k queryServer) ProofRequest(goCtx context.Context, req *types.QueryProofRequestRequest) (*types.QueryProofRequestResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	if req.RequestId == "" {
		return nil, status.Error(codes.InvalidArgument, "request ID cannot be empty")
	}

	request, err := k.GetProofRequest(goCtx, req.RequestId)
	if err != nil {
		return nil, status.Error(codes.NotFound, "proof request not found")
	}

	return &types.QueryProofRequestResponse{Request: request}, nil
}

// ProofRequests returns all proof requests with optional filtering.
func (k queryServer) ProofRequests(goCtx context.Context, req *types.QueryProofRequestsRequest) (*types.QueryProofRequestsResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	var requests []types.ProofRequest

	// Get all proof requests
	err := k.Keeper.ProofRequests.Walk(goCtx, nil, func(key string, request types.ProofRequest) (bool, error) {
		// Apply filters
		if req.Requester != "" && request.Requester != req.Requester {
			return false, nil
		}
		if req.TargetProver != "" && request.TargetProver != req.TargetProver {
			return false, nil
		}
		if req.Status != "" && request.Status != req.Status {
			return false, nil
		}

		requests = append(requests, request)
		return false, nil
	})

	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &types.QueryProofRequestsResponse{Requests: requests}, nil
}

// CircuitStats returns statistics for a specific circuit.
func (k queryServer) CircuitStats(goCtx context.Context, req *types.QueryCircuitStatsRequest) (*types.QueryCircuitStatsResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	if req.CircuitId == "" {
		return nil, status.Error(codes.InvalidArgument, "circuit ID cannot be empty")
	}

	circuit, err := k.GetCircuit(goCtx, req.CircuitId)
	if err != nil {
		return nil, status.Error(codes.NotFound, "circuit not found")
	}

	// Count proofs by status for this circuit
	var totalProofs, validProofs, invalidProofs, pendingProofs uint64
	
	rng := collections.NewPrefixedPairRange[string, string](req.CircuitId)
	err = k.ProofsByCircuit.Walk(goCtx, rng, func(key collections.Pair[string, string], proofID string) (bool, error) {
		proof, err := k.GetProof(goCtx, proofID)
		if err != nil {
			return true, err
		}

		totalProofs++
		switch proof.Status {
		case types.ProofStatusValid:
			validProofs++
		case types.ProofStatusInvalid:
			invalidProofs++
		case types.ProofStatusPending:
			pendingProofs++
		}
		return false, nil
	})

	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	stats := types.CircuitStats{
		CircuitId:        circuit.Id,
		TotalProofs:      totalProofs,
		ValidProofs:      validProofs,
		InvalidProofs:    invalidProofs,
		PendingProofs:    pendingProofs,
		SuccessRate:      float64(validProofs) / float64(totalProofs) * 100.0,
		CreatedAt:        circuit.CreatedAt,
		LastProofAt:      circuit.UpdatedAt,
		IsActive:         circuit.Active,
	}

	// Handle division by zero
	if totalProofs == 0 {
		stats.SuccessRate = 0
	}

	return &types.QueryCircuitStatsResponse{Stats: stats}, nil
}

// ProofsByProver returns all proofs created by a specific prover.
func (k queryServer) ProofsByProver(goCtx context.Context, req *types.QueryProofsByProverRequest) (*types.QueryProofsByProverResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	if req.Prover == "" {
		return nil, status.Error(codes.InvalidArgument, "prover cannot be empty")
	}

	proofs := k.GetProofsByProver(goCtx, req.Prover)

	return &types.QueryProofsByProverResponse{Proofs: proofs}, nil
}

// ProofsByStatus returns all proofs with a specific status.
func (k queryServer) ProofsByStatus(goCtx context.Context, req *types.QueryProofsByStatusRequest) (*types.QueryProofsByStatusResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	if req.Status == "" {
		return nil, status.Error(codes.InvalidArgument, "status cannot be empty")
	}

	// Validate status
	proofStatus := types.ProofStatus(req.Status)
	switch proofStatus {
	case types.ProofStatusPending, types.ProofStatusValid, types.ProofStatusInvalid, types.ProofStatusExpired:
		// Valid status
	default:
		return nil, status.Error(codes.InvalidArgument, "invalid status")
	}

	proofs := k.GetProofsByStatus(goCtx, proofStatus)

	return &types.QueryProofsByStatusResponse{Proofs: proofs}, nil
}