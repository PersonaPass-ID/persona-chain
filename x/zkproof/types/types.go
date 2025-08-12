package types

import (
	"fmt"
	"time"

	"cosmossdk.io/math"
	"github.com/cosmos/gogoproto/proto"
	sdk "github.com/cosmos/cosmos-sdk/types"
)


// ProofType represents different zero-knowledge proof types
type ProofType string

const (
	ProofTypeGroth16     ProofType = "groth16"
	ProofTypePLONK       ProofType = "plonk"
	ProofTypeSTARK       ProofType = "stark"
	ProofTypeBulletproof ProofType = "bulletproof"
)

// ProofStatus represents the status of a proof
type ProofStatus string

const (
	ProofStatusPending   ProofStatus = "pending"
	ProofStatusValid     ProofStatus = "valid"
	ProofStatusInvalid   ProofStatus = "invalid"
	ProofStatusExpired   ProofStatus = "expired"
)

// CircuitType represents different types of circuits
type CircuitType string

const (
	CircuitTypeArithmetic CircuitType = "arithmetic"
	CircuitTypeBoolean    CircuitType = "boolean"
	CircuitTypeHash       CircuitType = "hash"
	CircuitTypeSignature CircuitType = "signature"
	CircuitTypeMembership CircuitType = "membership"
	CircuitTypeRange      CircuitType = "range"
	CircuitTypeCustom     CircuitType = "custom"
)

// Circuit represents a zero-knowledge proof circuit
type Circuit struct {
	// Unique identifier for the circuit
	Id string `json:"id"`

	// Human-readable name
	Name string `json:"name"`

	// Description of what the circuit proves
	Description string `json:"description"`

	// Creator of the circuit (DID)
	Creator string `json:"creator"`

	// Type of circuit
	CircuitType CircuitType `json:"circuitType"`

	// Supported proof types for this circuit
	SupportedProofTypes []ProofType `json:"supportedProofTypes"`

	// Circuit definition/constraints
	CircuitData []byte `json:"circuitData"`

	// Circuit parameters (proving key, verifying key, etc.)
	Parameters []byte `json:"parameters"`

	// Public inputs specification
	PublicInputsSpec []string `json:"publicInputsSpec"`

	// Private inputs specification
	PrivateInputsSpec []string `json:"privateInputsSpec"`

	// Whether circuit requires public inputs
	RequiresPublicInputs bool `json:"requiresPublicInputs"`

	// Maximum proof size allowed
	MaxProofSize uint64 `json:"maxProofSize"`

	// Circuit complexity metrics
	NumConstraints uint64 `json:"numConstraints"`
	NumVariables   uint64 `json:"numVariables"`
	NumPublicInputs uint64 `json:"numPublicInputs"`

	// Verification settings
	VerificationMethod string `json:"verificationMethod"`
	TrustedSetup       bool   `json:"trustedSetup"`

	// Lifecycle
	Version   uint64    `json:"version"`
	Active    bool      `json:"active"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Blockchain metadata
	BlockHeight int64  `json:"blockHeight"`
	TxHash      string `json:"txHash"`

	// Usage statistics
	ProofCount      uint64 `json:"proofCount"`
	SuccessfulProofs uint64 `json:"successfulProofs"`
}

// ZKProof represents a zero-knowledge proof
type ZKProof struct {
	// Unique identifier for the proof
	Id string `json:"id"`

	// Reference to the circuit used
	CircuitId string `json:"circuitId"`

	// Prover (DID who generated the proof)
	Prover string `json:"prover"`

	// Verifier (DID who can verify the proof, optional)
	Verifier string `json:"verifier"`

	// Type of proof
	ProofType ProofType `json:"proofType"`

	// The actual proof data
	ProofData []byte `json:"proofData"`

	// Public inputs to the proof
	PublicInputs []string `json:"publicInputs"`

	// Auxiliary data for verification
	VerificationData []byte `json:"verificationData"`

	// Proof status
	Status ProofStatus `json:"status"`

	// Proof validity period
	ValidFrom time.Time  `json:"validFrom"`
	ValidTo   *time.Time `json:"validTo,omitempty"`

	// Verification details
	VerificationMethod    string     `json:"verificationMethod"`
	VerificationTimestamp time.Time  `json:"verificationTimestamp"`
	VerificationResult    string     `json:"verificationResult"`

	// Metadata
	Description string            `json:"description,omitempty"`
	Tags        []string          `json:"tags,omitempty"`
	Metadata    map[string]string `json:"metadata,omitempty"`

	// Lifecycle
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Blockchain metadata
	BlockHeight int64  `json:"blockHeight"`
	TxHash      string `json:"txHash"`

	// Fee and payment information
	ProofFee sdk.Coins `json:"proofFee"`
}

// ProofRequest represents a request for a zero-knowledge proof
type ProofRequest struct {
	// Unique identifier for the request
	Id string `json:"id"`

	// Requester (DID who requested the proof)
	Requester string `json:"requester"`

	// Target prover (DID who should generate the proof)
	TargetProver string `json:"targetProver"`

	// Circuit to use for the proof
	CircuitId string `json:"circuitId"`

	// Required proof type
	RequiredProofType ProofType `json:"requiredProofType"`

	// Challenge or specific requirements
	Challenge string `json:"challenge"`

	// Public inputs required for the proof
	RequiredPublicInputs []string `json:"requiredPublicInputs"`

	// Deadline for proof submission
	Deadline time.Time `json:"deadline"`

	// Reward for completing the proof
	Reward sdk.Coins `json:"reward"`

	// Request status
	Status string `json:"status"`

	// Associated proof ID (when completed)
	ProofId string `json:"proofId,omitempty"`

	// Lifecycle
	CreatedAt   time.Time `json:"createdAt"`
	CompletedAt time.Time `json:"completedAt,omitempty"`

	// Blockchain metadata
	BlockHeight int64  `json:"blockHeight"`
	TxHash      string `json:"txHash"`
}

// Params represents module parameters
type Params struct {
	// Maximum circuit size in bytes
	MaxCircuitSize uint64 `json:"maxCircuitSize"`

	// Maximum proof size in bytes
	MaxProofSize uint64 `json:"maxProofSize"`

	// Maximum number of public inputs
	MaxPublicInputs uint64 `json:"maxPublicInputs"`

	// Circuit creation fee
	CircuitCreationFee sdk.Coins `json:"circuitCreationFee"`

	// Proof submission fee
	ProofSubmissionFee sdk.Coins `json:"proofSubmissionFee"`

	// Proof verification fee
	ProofVerificationFee sdk.Coins `json:"proofVerificationFee"`

	// Proof request fee
	ProofRequestFee sdk.Coins `json:"proofRequestFee"`

	// Proof validity period (seconds)
	ProofValidityPeriod uint64 `json:"proofValidityPeriod"`

	// Allowed proof types
	AllowedProofTypes []ProofType `json:"allowedProofTypes"`

	// Allowed circuit types
	AllowedCircuitTypes []CircuitType `json:"allowedCircuitTypes"`

	// Minimum stake required for circuit creation
	MinCircuitStake sdk.Coins `json:"minCircuitStake"`
}

// DefaultParams returns default parameters
func DefaultParams() Params {
	return Params{
		MaxCircuitSize:       1024 * 1024, // 1MB
		MaxProofSize:         512 * 1024,  // 512KB
		MaxPublicInputs:      100,
		CircuitCreationFee:   sdk.NewCoins(sdk.NewCoin("upersona", math.NewInt(10000))),
		ProofSubmissionFee:   sdk.NewCoins(sdk.NewCoin("upersona", math.NewInt(1000))),
		ProofVerificationFee: sdk.NewCoins(sdk.NewCoin("upersona", math.NewInt(500))),
		ProofRequestFee:      sdk.NewCoins(sdk.NewCoin("upersona", math.NewInt(2000))),
		ProofValidityPeriod:  86400 * 30, // 30 days
		AllowedProofTypes:    []ProofType{ProofTypeGroth16, ProofTypePLONK, ProofTypeSTARK, ProofTypeBulletproof},
		AllowedCircuitTypes:  []CircuitType{CircuitTypeArithmetic, CircuitTypeBoolean, CircuitTypeHash, CircuitTypeSignature, CircuitTypeMembership, CircuitTypeRange, CircuitTypeCustom},
		MinCircuitStake:      sdk.NewCoins(sdk.NewCoin("upersona", math.NewInt(50000))),
	}
}

// Validation methods

// Validate validates a circuit
func (c *Circuit) Validate() error {
	if c.Id == "" {
		return fmt.Errorf("circuit ID cannot be empty")
	}
	if c.Name == "" {
		return fmt.Errorf("circuit name cannot be empty")
	}
	if c.Creator == "" {
		return fmt.Errorf("circuit creator cannot be empty")
	}
	if len(c.CircuitData) == 0 {
		return fmt.Errorf("circuit data cannot be empty")
	}
	if len(c.SupportedProofTypes) == 0 {
		return fmt.Errorf("circuit must support at least one proof type")
	}
	return nil
}

// Validate validates a zero-knowledge proof
func (p *ZKProof) Validate() error {
	if p.Id == "" {
		return fmt.Errorf("proof ID cannot be empty")
	}
	if p.CircuitId == "" {
		return fmt.Errorf("circuit ID cannot be empty")
	}
	if p.Prover == "" {
		return fmt.Errorf("prover cannot be empty")
	}
	if len(p.ProofData) == 0 {
		return fmt.Errorf("proof data cannot be empty")
	}
	if p.ProofType == "" {
		return fmt.Errorf("proof type cannot be empty")
	}
	return nil
}

// Validate validates a proof request
func (r *ProofRequest) Validate() error {
	if r.Id == "" {
		return fmt.Errorf("request ID cannot be empty")
	}
	if r.Requester == "" {
		return fmt.Errorf("requester cannot be empty")
	}
	if r.TargetProver == "" {
		return fmt.Errorf("target prover cannot be empty")
	}
	if r.CircuitId == "" {
		return fmt.Errorf("circuit ID cannot be empty")
	}
	if r.RequiredProofType == "" {
		return fmt.Errorf("required proof type cannot be empty")
	}
	if r.Deadline.Before(time.Now()) {
		return fmt.Errorf("deadline cannot be in the past")
	}
	return nil
}

// Validate validates parameters
func (p Params) Validate() error {
	if p.MaxCircuitSize == 0 {
		return fmt.Errorf("max circuit size cannot be zero")
	}
	if p.MaxProofSize == 0 {
		return fmt.Errorf("max proof size cannot be zero")
	}
	if p.MaxPublicInputs == 0 {
		return fmt.Errorf("max public inputs cannot be zero")
	}
	if p.ProofValidityPeriod == 0 {
		return fmt.Errorf("proof validity period cannot be zero")
	}
	if len(p.AllowedProofTypes) == 0 {
		return fmt.Errorf("must allow at least one proof type")
	}
	if len(p.AllowedCircuitTypes) == 0 {
		return fmt.Errorf("must allow at least one circuit type")
	}
	return nil
}

// Helper methods

// IsCompatibleWithProofType checks if a circuit supports a proof type
func (c *Circuit) IsCompatibleWithProofType(proofType ProofType) bool {
	for _, pt := range c.SupportedProofTypes {
		if pt == proofType {
			return true
		}
	}
	return false
}

// IsExpired checks if a proof has expired
func (p *ZKProof) IsExpired() bool {
	if p.ValidTo == nil {
		return false
	}
	return time.Now().After(*p.ValidTo)
}

// IsActive checks if a circuit is active
func (c *Circuit) IsActive() bool {
	return c.Active
}

// Implement proto.Message interface for all types

func (m *Circuit) ProtoMessage()     {}
func (m *Circuit) Reset()            { *m = Circuit{} }
func (m *Circuit) String() string    { return proto.CompactTextString(m) }

func (m *ZKProof) ProtoMessage()     {}
func (m *ZKProof) Reset()            { *m = ZKProof{} }
func (m *ZKProof) String() string    { return proto.CompactTextString(m) }

func (m *ProofRequest) ProtoMessage()  {}
func (m *ProofRequest) Reset()         { *m = ProofRequest{} }
func (m *ProofRequest) String() string { return proto.CompactTextString(m) }

func (m *Params) ProtoMessage()  {}
func (m *Params) Reset()         { *m = Params{} }
func (m *Params) String() string { return proto.CompactTextString(m) }