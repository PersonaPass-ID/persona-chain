package keeper

import (
	"context"
	"fmt"

	"cosmossdk.io/collections"
	"cosmossdk.io/core/store"
	"cosmossdk.io/log"

	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/PersonaPass-ID/personachain/x/zkproof/types"
)

type Keeper struct {
	cdc          codec.BinaryCodec
	storeService store.KVStoreService
	authority    string

	// Collections for type-safe storage following cheqd patterns
	Schema collections.Schema

	// Core zkproof storage
	Circuits         collections.Map[string, types.Circuit]
	Proofs           collections.Map[string, types.ZKProof]
	ProofRequests    collections.Map[string, types.ProofRequest]
	
	// Counters
	CircuitCount      collections.Item[uint64]
	ProofCount        collections.Item[uint64]
	ProofRequestCount collections.Item[uint64]

	// Indexing for efficient queries
	CircuitsByCreator collections.Map[collections.Pair[string, string], string] // creator -> circuit_id
	ProofsByProver    collections.Map[collections.Pair[string, string], string] // prover -> proof_id
	ProofsByVerifier  collections.Map[collections.Pair[string, string], string] // verifier -> proof_id
	ProofsByCircuit   collections.Map[collections.Pair[string, string], string] // circuit_id -> proof_id
	ProofsByStatus    collections.Map[collections.Pair[string, string], string] // status -> proof_id
	ProofsByType      collections.Map[collections.Pair[string, string], string] // proof_type -> proof_id

	// Parameters
	Params collections.Item[types.Params]

	// Expected keepers
	accountKeeper types.AccountKeeper
	bankKeeper    types.BankKeeper
	didKeeper     types.DIDKeeper
}

func NewKeeper(
	cdc codec.BinaryCodec,
	storeService store.KVStoreService,
	authority string,
	accountKeeper types.AccountKeeper,
	bankKeeper types.BankKeeper,
	didKeeper types.DIDKeeper,
) *Keeper {
	sb := collections.NewSchemaBuilder(storeService)

	k := &Keeper{
		cdc:           cdc,
		storeService:  storeService,
		authority:     authority,
		accountKeeper: accountKeeper,
		bankKeeper:    bankKeeper,
		didKeeper:     didKeeper,

		// Initialize collections
		Circuits:          collections.NewMap(sb, types.CircuitPrefix, "circuits", collections.StringKey, codec.CollValue[types.Circuit](cdc)),
		Proofs:            collections.NewMap(sb, types.ProofPrefix, "proofs", collections.StringKey, codec.CollValue[types.ZKProof](cdc)),
		ProofRequests:     collections.NewMap(sb, types.ProofRequestPrefix, "proof_requests", collections.StringKey, codec.CollValue[types.ProofRequest](cdc)),
		
		CircuitCount:      collections.NewItem(sb, types.CircuitCountKey, "circuit_count", collections.Uint64Value),
		ProofCount:        collections.NewItem(sb, types.ProofCountKey, "proof_count", collections.Uint64Value),
		ProofRequestCount: collections.NewItem(sb, types.ProofRequestCountKey, "proof_request_count", collections.Uint64Value),

		// Indexes
		CircuitsByCreator: collections.NewMap(sb, types.CircuitsByCreatorPrefix, "circuits_by_creator", collections.PairKeyCodec(collections.StringKey, collections.StringKey), collections.StringValue),
		ProofsByProver:    collections.NewMap(sb, types.ProofsByProverPrefix, "proofs_by_prover", collections.PairKeyCodec(collections.StringKey, collections.StringKey), collections.StringValue),
		ProofsByVerifier:  collections.NewMap(sb, types.ProofsByVerifierPrefix, "proofs_by_verifier", collections.PairKeyCodec(collections.StringKey, collections.StringKey), collections.StringValue),
		ProofsByCircuit:   collections.NewMap(sb, types.ProofsByCircuitPrefix, "proofs_by_circuit", collections.PairKeyCodec(collections.StringKey, collections.StringKey), collections.StringValue),
		ProofsByStatus:    collections.NewMap(sb, types.ProofsByStatusPrefix, "proofs_by_status", collections.PairKeyCodec(collections.StringKey, collections.StringKey), collections.StringValue),
		ProofsByType:      collections.NewMap(sb, types.ProofsByTypePrefix, "proofs_by_type", collections.PairKeyCodec(collections.StringKey, collections.StringKey), collections.StringValue),

		// Parameters
		Params: collections.NewItem(sb, types.ParamsKey, "params", codec.CollValue[types.Params](cdc)),
	}

	schema, err := sb.Build()
	if err != nil {
		panic(err)
	}
	k.Schema = schema

	return k
}

// GetAuthority returns the module's authority.
func (k Keeper) GetAuthority() string {
	return k.authority
}

// Logger returns a module-specific logger.
func (k Keeper) Logger(ctx context.Context) log.Logger {
	sdkCtx := sdk.UnwrapSDKContext(ctx)
	return sdkCtx.Logger().With("module", fmt.Sprintf("x/%s", types.ModuleName))
}

// GetParams returns the module parameters.
func (k Keeper) GetParams(ctx context.Context) (types.Params, error) {
	params, err := k.Params.Get(ctx)
	if err != nil {
		return types.Params{}, err
	}
	return params, nil
}

// SetParams sets the module parameters.
func (k Keeper) SetParams(ctx context.Context, params types.Params) error {
	return k.Params.Set(ctx, params)
}

// GetStoreKey returns the KVStoreKey for the provided store key.
func (k Keeper) GetStoreKey() store.KVStoreService {
	return k.storeService
}

// GetCodec returns the codec.
func (k Keeper) GetCodec() codec.BinaryCodec {
	return k.cdc
}

// Circuit operations

// CreateCircuit creates a new zero-knowledge proof circuit.
func (k Keeper) CreateCircuit(ctx context.Context, circuit types.Circuit) error {
	// Validate circuit
	if err := circuit.Validate(); err != nil {
		return err
	}

	// Check if circuit already exists
	exists, err := k.Circuits.Has(ctx, circuit.Id)
	if err != nil {
		return err
	}
	if exists {
		return types.ErrCircuitAlreadyExists
	}

	// Store circuit
	if err := k.Circuits.Set(ctx, circuit.Id, circuit); err != nil {
		return err
	}

	// Update creator index
	creatorKey := collections.Join(circuit.Creator, circuit.Id)
	if err := k.CircuitsByCreator.Set(ctx, creatorKey, circuit.Id); err != nil {
		return err
	}

	// Increment count
	count, _ := k.CircuitCount.Get(ctx)
	return k.CircuitCount.Set(ctx, count+1)
}

// GetCircuit retrieves a circuit by ID.
func (k Keeper) GetCircuit(ctx context.Context, id string) (types.Circuit, error) {
	return k.Circuits.Get(ctx, id)
}

// Proof operations

// SubmitProof submits a zero-knowledge proof.
func (k Keeper) SubmitProof(ctx context.Context, proof types.ZKProof) error {
	// Validate proof
	if err := proof.Validate(); err != nil {
		return err
	}

	// Verify the circuit exists
	circuit, err := k.GetCircuit(ctx, proof.CircuitId)
	if err != nil {
		return types.ErrInvalidCircuit.Wrap("circuit not found")
	}

	// Verify the proof is for the correct circuit type
	if !circuit.IsCompatibleWithProofType(proof.ProofType) {
		return types.ErrInvalidProofType.Wrap("proof type not compatible with circuit")
	}

	// Store proof with pending status initially
	proof.Status = types.ProofStatusPending
	if err := k.Proofs.Set(ctx, proof.Id, proof); err != nil {
		return err
	}

	// Update indexes
	proverKey := collections.Join(proof.Prover, proof.Id)
	if err := k.ProofsByProver.Set(ctx, proverKey, proof.Id); err != nil {
		return err
	}

	if proof.Verifier != "" {
		verifierKey := collections.Join(proof.Verifier, proof.Id)
		if err := k.ProofsByVerifier.Set(ctx, verifierKey, proof.Id); err != nil {
			return err
		}
	}

	circuitKey := collections.Join(proof.CircuitId, proof.Id)
	if err := k.ProofsByCircuit.Set(ctx, circuitKey, proof.Id); err != nil {
		return err
	}

	statusKey := collections.Join(string(proof.Status), proof.Id)
	if err := k.ProofsByStatus.Set(ctx, statusKey, proof.Id); err != nil {
		return err
	}

	typeKey := collections.Join(string(proof.ProofType), proof.Id)
	if err := k.ProofsByType.Set(ctx, typeKey, proof.Id); err != nil {
		return err
	}

	// Increment count
	count, _ := k.ProofCount.Get(ctx)
	return k.ProofCount.Set(ctx, count+1)
}

// VerifyProof verifies a submitted proof.
func (k Keeper) VerifyProof(ctx context.Context, proofId string, verifier string) error {
	proof, err := k.GetProof(ctx, proofId)
	if err != nil {
		return err
	}

	// Check if the verifier is authorized
	if proof.Verifier != "" && proof.Verifier != verifier {
		return types.ErrUnauthorized.Wrap("not authorized to verify this proof")
	}

	// Get the circuit
	circuit, err := k.GetCircuit(ctx, proof.CircuitId)
	if err != nil {
		return err
	}

	// Perform verification based on proof type
	verified, err := k.performProofVerification(ctx, proof, circuit)
	if err != nil {
		return err
	}

	// Update proof status
	if verified {
		proof.Status = types.ProofStatusValid
	} else {
		proof.Status = types.ProofStatusInvalid
	}

	proof.VerificationTimestamp = sdk.UnwrapSDKContext(ctx).BlockTime()

	return k.Proofs.Set(ctx, proof.Id, proof)
}

// GetProof retrieves a proof by ID.
func (k Keeper) GetProof(ctx context.Context, id string) (types.ZKProof, error) {
	return k.Proofs.Get(ctx, id)
}

// performProofVerification performs the actual proof verification logic.
func (k Keeper) performProofVerification(ctx context.Context, proof types.ZKProof, circuit types.Circuit) (bool, error) {
	// This is where we would implement the actual zero-knowledge proof verification
	// For now, we'll do basic checks and assume verification passes
	
	// Check proof data is not empty
	if len(proof.ProofData) == 0 {
		return false, types.ErrInvalidProof.Wrap("proof data is empty")
	}

	// Check public inputs are provided if required
	if circuit.RequiresPublicInputs && len(proof.PublicInputs) == 0 {
		return false, types.ErrInvalidProof.Wrap("public inputs required but not provided")
	}

	// For demo purposes, we'll consider all proofs valid if they pass basic checks
	// In a real implementation, this would use cryptographic verification libraries
	return true, nil
}

// Proof Request operations

// CreateProofRequest creates a new proof request.
func (k Keeper) CreateProofRequest(ctx context.Context, request types.ProofRequest) error {
	if err := request.Validate(); err != nil {
		return err
	}

	// Check if request already exists
	exists, err := k.ProofRequests.Has(ctx, request.Id)
	if err != nil {
		return err
	}
	if exists {
		return types.ErrProofRequestAlreadyExists
	}

	// Store request
	if err := k.ProofRequests.Set(ctx, request.Id, request); err != nil {
		return err
	}

	// Increment count
	count, _ := k.ProofRequestCount.Get(ctx)
	return k.ProofRequestCount.Set(ctx, count+1)
}

// GetProofRequest retrieves a proof request by ID.
func (k Keeper) GetProofRequest(ctx context.Context, id string) (types.ProofRequest, error) {
	return k.ProofRequests.Get(ctx, id)
}

// Query helpers

// GetAllCircuits returns all circuits.
func (k Keeper) GetAllCircuits(ctx context.Context) []types.Circuit {
	var circuits []types.Circuit
	err := k.Circuits.Walk(ctx, nil, func(key string, circuit types.Circuit) (bool, error) {
		circuits = append(circuits, circuit)
		return false, nil
	})
	if err != nil {
		return nil
	}
	return circuits
}

// GetProofsByProver returns all proofs created by a specific prover.
func (k Keeper) GetProofsByProver(ctx context.Context, prover string) []types.ZKProof {
	var proofs []types.ZKProof
	rng := collections.NewPrefixedPairRange[string, string](prover)
	
	err := k.ProofsByProver.Walk(ctx, rng, func(key collections.Pair[string, string], proofID string) (bool, error) {
		proof, err := k.GetProof(ctx, proofID)
		if err != nil {
			return true, err
		}
		proofs = append(proofs, proof)
		return false, nil
	})
	
	if err != nil {
		return nil
	}
	return proofs
}

// GetProofsByStatus returns all proofs with a specific status.
func (k Keeper) GetProofsByStatus(ctx context.Context, status types.ProofStatus) []types.ZKProof {
	var proofs []types.ZKProof
	rng := collections.NewPrefixedPairRange[string, string](string(status))
	
	err := k.ProofsByStatus.Walk(ctx, rng, func(key collections.Pair[string, string], proofID string) (bool, error) {
		proof, err := k.GetProof(ctx, proofID)
		if err != nil {
			return true, err
		}
		proofs = append(proofs, proof)
		return false, nil
	})
	
	if err != nil {
		return nil
	}
	return proofs
}