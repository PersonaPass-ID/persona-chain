package types

// Event types for the zkproof module
const (
	EventTypeCircuitCreated      = "circuit_created"
	EventTypeCircuitUpdated      = "circuit_updated"
	EventTypeProofSubmitted      = "proof_submitted"
	EventTypeProofVerified       = "proof_verified"
	EventTypeProofRequestCreated = "proof_request_created"
)

// Attribute keys for events
const (
	AttributeKeyCircuitID       = "circuit_id"
	AttributeKeyCreator         = "creator"
	AttributeKeyCircuitType     = "circuit_type"
	AttributeKeyProofID         = "proof_id"
	AttributeKeyProver          = "prover"
	AttributeKeyVerifier        = "verifier"
	AttributeKeyProofType       = "proof_type"
	AttributeKeyProofStatus     = "proof_status"
	AttributeKeyProofRequestID  = "proof_request_id"
	AttributeKeyRequester       = "requester"
	AttributeKeyTargetProver    = "target_prover"
)