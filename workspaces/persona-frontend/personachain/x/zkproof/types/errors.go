package types

import (
	"cosmossdk.io/errors"
)

// ZKProof module errors
var (
	ErrInvalidProof              = errors.Register(ModuleName, 2, "invalid proof")
	ErrInvalidCircuit            = errors.Register(ModuleName, 3, "invalid circuit")
	ErrInvalidProver             = errors.Register(ModuleName, 4, "invalid prover")
	ErrInvalidVerifier           = errors.Register(ModuleName, 5, "invalid verifier")
	ErrProofNotFound             = errors.Register(ModuleName, 6, "proof not found")
	ErrCircuitNotFound           = errors.Register(ModuleName, 7, "circuit not found")
	ErrCircuitInactive           = errors.Register(ModuleName, 8, "circuit is inactive")
	ErrProofExpired              = errors.Register(ModuleName, 9, "proof has expired")
	ErrProofAlreadyVerified      = errors.Register(ModuleName, 10, "proof already verified")
	ErrInvalidProofType          = errors.Register(ModuleName, 11, "invalid proof type")
	ErrUnsupportedProofType      = errors.Register(ModuleName, 12, "unsupported proof type")
	ErrInvalidCircuitType        = errors.Register(ModuleName, 13, "invalid circuit type")
	ErrInvalidPublicInputs       = errors.Register(ModuleName, 14, "invalid public inputs")
	ErrInvalidPrivateInputs      = errors.Register(ModuleName, 15, "invalid private inputs")
	ErrCircuitSizeTooLarge       = errors.Register(ModuleName, 16, "circuit size too large")
	ErrProofSizeTooLarge         = errors.Register(ModuleName, 17, "proof size too large")
	ErrInsufficientFee           = errors.Register(ModuleName, 18, "insufficient fee")
	ErrInvalidController         = errors.Register(ModuleName, 19, "invalid controller")
	ErrUnauthorized              = errors.Register(ModuleName, 20, "unauthorized")
	ErrProofVerificationFailed   = errors.Register(ModuleName, 21, "proof verification failed")
	ErrInvalidProofRequest       = errors.Register(ModuleName, 22, "invalid proof request")
	ErrProofRequestExpired       = errors.Register(ModuleName, 23, "proof request expired")
	ErrProofRequestNotFound      = errors.Register(ModuleName, 24, "proof request not found")
	ErrInvalidParameters         = errors.Register(ModuleName, 25, "invalid parameters")
	ErrTooManyPublicInputs       = errors.Register(ModuleName, 26, "too many public inputs")
	ErrCircuitAlreadyExists      = errors.Register(ModuleName, 27, "circuit already exists")
	ErrProofRequestAlreadyExists = errors.Register(ModuleName, 28, "proof request already exists")
	ErrCircuitTooLarge           = errors.Register(ModuleName, 29, "circuit too large")
	ErrProofTooLarge             = errors.Register(ModuleName, 30, "proof too large")
	ErrInsufficientFees          = errors.Register(ModuleName, 31, "insufficient fees")
)