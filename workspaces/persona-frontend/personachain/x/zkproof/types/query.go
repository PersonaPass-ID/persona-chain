package types

import (
	"context"
	"time"
)

// Query requests

// QueryParamsRequest is the request type for the Query/Params RPC method.
type QueryParamsRequest struct{}

// QueryParamsResponse is the response type for the Query/Params RPC method.
type QueryParamsResponse struct {
	Params Params `json:"params"`
}

// QueryCircuitRequest is the request type for the Query/Circuit RPC method.
type QueryCircuitRequest struct {
	CircuitId string `json:"circuit_id"`
}

// QueryCircuitResponse is the response type for the Query/Circuit RPC method.
type QueryCircuitResponse struct {
	Circuit Circuit `json:"circuit"`
}

// QueryCircuitsRequest is the request type for the Query/Circuits RPC method.
type QueryCircuitsRequest struct {
	Creator string `json:"creator,omitempty"`
}

// QueryCircuitsResponse is the response type for the Query/Circuits RPC method.
type QueryCircuitsResponse struct {
	Circuits []Circuit `json:"circuits"`
}

// QueryProofRequest is the request type for the Query/Proof RPC method.
type QueryProofRequest struct {
	ProofId string `json:"proof_id"`
}

// QueryProofResponse is the response type for the Query/Proof RPC method.
type QueryProofResponse struct {
	Proof ZKProof `json:"proof"`
}

// QueryProofsRequest is the request type for the Query/Proofs RPC method.
type QueryProofsRequest struct {
	Prover    string `json:"prover,omitempty"`
	Verifier  string `json:"verifier,omitempty"`
	CircuitId string `json:"circuit_id,omitempty"`
	Status    string `json:"status,omitempty"`
}

// QueryProofsResponse is the response type for the Query/Proofs RPC method.
type QueryProofsResponse struct {
	Proofs []ZKProof `json:"proofs"`
}

// QueryProofRequestRequest is the request type for the Query/ProofRequest RPC method.
type QueryProofRequestRequest struct {
	RequestId string `json:"request_id"`
}

// QueryProofRequestResponse is the response type for the Query/ProofRequest RPC method.
type QueryProofRequestResponse struct {
	Request ProofRequest `json:"request"`
}

// QueryProofRequestsRequest is the request type for the Query/ProofRequests RPC method.
type QueryProofRequestsRequest struct {
	Requester    string `json:"requester,omitempty"`
	TargetProver string `json:"target_prover,omitempty"`
	Status       string `json:"status,omitempty"`
}

// QueryProofRequestsResponse is the response type for the Query/ProofRequests RPC method.
type QueryProofRequestsResponse struct {
	Requests []ProofRequest `json:"requests"`
}

// QueryCircuitStatsRequest is the request type for the Query/CircuitStats RPC method.
type QueryCircuitStatsRequest struct {
	CircuitId string `json:"circuit_id"`
}

// QueryCircuitStatsResponse is the response type for the Query/CircuitStats RPC method.
type QueryCircuitStatsResponse struct {
	Stats CircuitStats `json:"stats"`
}

// QueryProofsByProverRequest is the request type for the Query/ProofsByProver RPC method.
type QueryProofsByProverRequest struct {
	Prover string `json:"prover"`
}

// QueryProofsByProverResponse is the response type for the Query/ProofsByProver RPC method.
type QueryProofsByProverResponse struct {
	Proofs []ZKProof `json:"proofs"`
}

// QueryProofsByStatusRequest is the request type for the Query/ProofsByStatus RPC method.
type QueryProofsByStatusRequest struct {
	Status string `json:"status"`
}

// QueryProofsByStatusResponse is the response type for the Query/ProofsByStatus RPC method.
type QueryProofsByStatusResponse struct {
	Proofs []ZKProof `json:"proofs"`
}

// CircuitStats represents statistics for a circuit.
type CircuitStats struct {
	CircuitId     string    `json:"circuit_id"`
	TotalProofs   uint64    `json:"total_proofs"`
	ValidProofs   uint64    `json:"valid_proofs"`
	InvalidProofs uint64    `json:"invalid_proofs"`
	PendingProofs uint64    `json:"pending_proofs"`
	SuccessRate   float64   `json:"success_rate"`
	CreatedAt     time.Time `json:"created_at"`
	LastProofAt   time.Time `json:"last_proof_at"`
	IsActive      bool      `json:"is_active"`
}

// QueryServer is the server API for Query service.
type QueryServer interface {
	// Params queries the module parameters
	Params(ctx context.Context, req *QueryParamsRequest) (*QueryParamsResponse, error)
	
	// Circuit queries a circuit by ID
	Circuit(ctx context.Context, req *QueryCircuitRequest) (*QueryCircuitResponse, error)
	
	// Circuits queries all circuits with optional filtering
	Circuits(ctx context.Context, req *QueryCircuitsRequest) (*QueryCircuitsResponse, error)
	
	// Proof queries a proof by ID
	Proof(ctx context.Context, req *QueryProofRequest) (*QueryProofResponse, error)
	
	// Proofs queries proofs with optional filtering
	Proofs(ctx context.Context, req *QueryProofsRequest) (*QueryProofsResponse, error)
	
	// ProofRequest queries a proof request by ID
	ProofRequest(ctx context.Context, req *QueryProofRequestRequest) (*QueryProofRequestResponse, error)
	
	// ProofRequests queries all proof requests with optional filtering
	ProofRequests(ctx context.Context, req *QueryProofRequestsRequest) (*QueryProofRequestsResponse, error)
	
	// CircuitStats queries statistics for a specific circuit
	CircuitStats(ctx context.Context, req *QueryCircuitStatsRequest) (*QueryCircuitStatsResponse, error)
	
	// ProofsByProver queries all proofs created by a specific prover
	ProofsByProver(ctx context.Context, req *QueryProofsByProverRequest) (*QueryProofsByProverResponse, error)
	
	// ProofsByStatus queries all proofs with a specific status
	ProofsByStatus(ctx context.Context, req *QueryProofsByStatusRequest) (*QueryProofsByStatusResponse, error)
}