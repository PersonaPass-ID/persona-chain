package types

import (
	errorsmod "cosmossdk.io/errors"
)

// Credential module error codes
var (
	ErrInvalidCredential       = errorsmod.Register(ModuleName, 2, "invalid credential")
	ErrCredentialNotFound      = errorsmod.Register(ModuleName, 3, "credential not found")
	ErrCredentialAlreadyExists = errorsmod.Register(ModuleName, 4, "credential already exists")
	ErrInvalidIssuer           = errorsmod.Register(ModuleName, 5, "invalid issuer")
	ErrInvalidSubject          = errorsmod.Register(ModuleName, 6, "invalid subject")
	ErrInvalidHolder           = errorsmod.Register(ModuleName, 7, "invalid holder")
	ErrInvalidProof            = errorsmod.Register(ModuleName, 8, "invalid proof")
	ErrExpiredCredential       = errorsmod.Register(ModuleName, 9, "credential expired")
	ErrRevokedCredential       = errorsmod.Register(ModuleName, 10, "credential revoked")
	ErrInvalidPresentation     = errorsmod.Register(ModuleName, 11, "invalid presentation")
	ErrPresentationNotFound    = errorsmod.Register(ModuleName, 12, "presentation not found")
	ErrUnauthorized            = errorsmod.Register(ModuleName, 13, "unauthorized")
	ErrInsufficientFunds       = errorsmod.Register(ModuleName, 14, "insufficient funds")
	ErrInvalidCredentialType   = errorsmod.Register(ModuleName, 15, "invalid credential type")
	ErrInvalidSchema           = errorsmod.Register(ModuleName, 16, "invalid credential schema")
	ErrCredentialRevoked       = errorsmod.Register(ModuleName, 17, "credential already revoked")
	ErrInvalidRevocation       = errorsmod.Register(ModuleName, 18, "invalid revocation")
	ErrInvalidSignature        = errorsmod.Register(ModuleName, 19, "invalid signature")
	ErrInvalidVerificationMethod = errorsmod.Register(ModuleName, 20, "invalid verification method")
	ErrInvalidController       = errorsmod.Register(ModuleName, 21, "invalid controller")
	ErrInvalidDID              = errorsmod.Register(ModuleName, 22, "invalid DID")
	ErrCredentialSizeExceeded  = errorsmod.Register(ModuleName, 23, "credential size exceeded maximum allowed")
	ErrInvalidCredentialData   = errorsmod.Register(ModuleName, 24, "invalid credential data")
	ErrCredentialNotActive     = errorsmod.Register(ModuleName, 25, "credential not active")
)