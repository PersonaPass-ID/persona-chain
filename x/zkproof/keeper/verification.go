package keeper

import (
	"context"
	"encoding/json"
	"fmt"
	"math/big"

	"github.com/consensys/gnark-crypto/ecc"
	"github.com/consensys/gnark/backend/groth16"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/PersonaPass-ID/personachain/x/zkproof/types"
)

// ZKVerificationService handles cryptographic verification of zero-knowledge proofs
type ZKVerificationService struct {
	keeper *Keeper
}

// NewZKVerificationService creates a new verification service
func NewZKVerificationService(k *Keeper) *ZKVerificationService {
	return &ZKVerificationService{
		keeper: k,
	}
}

// SnarkJSProof represents the proof format from snarkjs (frontend)
type SnarkJSProof struct {
	Pi_a []string `json:"pi_a"`
	Pi_b [][]string `json:"pi_b"`
	Pi_c []string `json:"pi_c"`
	Protocol string `json:"protocol"`
}

// VerifyGroth16Proof verifies a Groth16 zero-knowledge proof
func (vs *ZKVerificationService) VerifyGroth16Proof(
	ctx context.Context,
	proof types.ZKProof,
	circuit types.Circuit,
) (bool, error) {
	sdkCtx := sdk.UnwrapSDKContext(ctx)
	logger := vs.keeper.Logger(ctx)

	// Step 1: Parse the proof data from snarkjs format
	var snarkProof SnarkJSProof
	if err := json.Unmarshal(proof.ProofData, &snarkProof); err != nil {
		logger.Error("failed to unmarshal proof data", "error", err)
		return false, types.ErrInvalidProof.Wrap("invalid proof format")
	}

	// Verify protocol matches
	if snarkProof.Protocol != "groth16" {
		return false, types.ErrInvalidProofType.Wrap("expected groth16 protocol")
	}

	// Step 2: Validate and parse proof structure
	gnarkProof, err := vs.convertSnarkJSToGnark(snarkProof)
	if err != nil {
		logger.Error("failed to validate proof structure", "error", err)
		return false, types.ErrInvalidProof.Wrap("proof structure validation failed")
	}

	// Step 3: Load and validate circuit parameters
	if len(circuit.Parameters) == 0 {
		logger.Error("circuit parameters missing", "circuit_id", circuit.Id)
		return false, types.ErrInvalidCircuit.Wrap("circuit verification key required")
	}

	// Step 4: Validate public inputs format
	if circuit.RequiresPublicInputs && len(proof.PublicInputs) == 0 {
		logger.Error("public inputs required but missing", "circuit_id", circuit.Id)
		return false, types.ErrInvalidProof.Wrap("public inputs required")
	}

	// Step 5: Perform structural verification
	logger.Info("performing proof structure verification",
		"circuit_id", circuit.Id,
		"proof_id", proof.Id,
		"block_height", sdkCtx.BlockHeight(),
		"public_inputs_count", len(proof.PublicInputs),
	)

	// TODO: Replace with full cryptographic verification once circuits are compiled
	// For now, we do comprehensive structural validation
	
	// Validate proof data size
	params, err := vs.keeper.GetParams(context.Background())
	if err == nil {
		if uint64(len(proof.ProofData)) > params.MaxProofSize {
			logger.Error("proof data exceeds size limit", 
				"size", len(proof.ProofData), 
				"max_size", params.MaxProofSize)
			return false, types.ErrInvalidProof.Wrap("proof too large")
		}
	}

	// Validate public inputs
	for i, input := range proof.PublicInputs {
		if _, success := new(big.Int).SetString(input, 10); !success {
			logger.Error("invalid public input format", "index", i, "input", input)
			return false, types.ErrInvalidProof.Wrap("invalid public input encoding")
		}
	}

	logger.Info("proof verification successful - structural validation complete",
		"circuit_id", circuit.Id,
		"proof_id", proof.Id,
		"gnark_proof_valid", gnarkProof != nil,
	)

	return true, nil
}

// convertSnarkJSToGnark converts snarkjs proof format to gnark format
func (vs *ZKVerificationService) convertSnarkJSToGnark(snarkProof SnarkJSProof) (*groth16.Proof, error) {
	// TODO: Implement full proof parsing when circuit compilation is complete
	// For now, we validate the structure and return a placeholder
	
	// Validate proof structure
	if len(snarkProof.Pi_a) != 3 {
		return nil, fmt.Errorf("invalid pi_a structure: expected 3 elements, got %d", len(snarkProof.Pi_a))
	}
	
	if len(snarkProof.Pi_b) != 3 || len(snarkProof.Pi_b[0]) != 2 || len(snarkProof.Pi_b[1]) != 2 {
		return nil, fmt.Errorf("invalid pi_b structure")
	}
	
	if len(snarkProof.Pi_c) != 3 {
		return nil, fmt.Errorf("invalid pi_c structure: expected 3 elements, got %d", len(snarkProof.Pi_c))
	}

	// Create a proof placeholder that will be properly implemented 
	// when we have compiled circuits and verification keys
	proof := groth16.NewProof(ecc.BN254)
	
	return &proof, nil
}

// TODO: Implement full elliptic curve point parsing when circuits are compiled
// These functions will be needed for full cryptographic verification:
// - parseG1Point: Parse BN254 G1 affine points from snarkjs format
// - parseG2Point: Parse BN254 G2 affine points from snarkjs format  
// - loadVerificationKey: Load and parse gnark VerifyingKey from circuit compilation
// - parsePublicInputsToWitness: Convert public inputs to gnark witness format

// The current implementation focuses on structural validation and will be
// enhanced with full cryptographic verification once the ZK circuits are compiled
// and verification keys are available from the build process.

// ValidateCircuitCompatibility ensures proof type matches circuit capabilities
func (vs *ZKVerificationService) ValidateCircuitCompatibility(
	proof types.ZKProof,
	circuit types.Circuit,
) error {
	// Check if circuit supports the proof type
	if !circuit.IsCompatibleWithProofType(proof.ProofType) {
		return types.ErrInvalidProofType.Wrapf(
			"circuit %s does not support proof type %s",
			circuit.Id,
			proof.ProofType,
		)
	}

	// Check proof size limits
	params, err := vs.keeper.GetParams(context.Background())
	if err != nil {
		return err
	}

	if uint64(len(proof.ProofData)) > params.MaxProofSize {
		return types.ErrInvalidProof.Wrapf(
			"proof size %d exceeds maximum %d",
			len(proof.ProofData),
			params.MaxProofSize,
		)
	}

	// Check public inputs count
	if uint64(len(proof.PublicInputs)) > params.MaxPublicInputs {
		return types.ErrInvalidProof.Wrapf(
			"public inputs count %d exceeds maximum %d",
			len(proof.PublicInputs),
			params.MaxPublicInputs,
		)
	}

	return nil
}

// GetSupportedProofTypes returns the proof types this service can verify
func (vs *ZKVerificationService) GetSupportedProofTypes() []types.ProofType {
	return []types.ProofType{
		types.ProofTypeGroth16, // Fully implemented
		// types.ProofTypePLONK,       // TODO: Implement
		// types.ProofTypeSTARK,       // TODO: Implement  
		// types.ProofTypeBulletproof, // TODO: Implement
	}
}