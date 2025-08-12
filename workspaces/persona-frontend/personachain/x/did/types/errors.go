package types

import (
	errorsmod "cosmossdk.io/errors"
)

var (
	ErrInvalidController    = errorsmod.Register(ModuleName, 2, "invalid controller")
	ErrInvalidDID          = errorsmod.Register(ModuleName, 3, "invalid DID")
	ErrDIDAlreadyExists    = errorsmod.Register(ModuleName, 4, "DID already exists")
	ErrDIDNotFound         = errorsmod.Register(ModuleName, 5, "DID not found")
	ErrUnauthorized        = errorsmod.Register(ModuleName, 6, "unauthorized")
	ErrInvalidAuthority    = errorsmod.Register(ModuleName, 7, "invalid authority")
	ErrDIDDeactivated      = errorsmod.Register(ModuleName, 8, "DID is deactivated")
	ErrInvalidDocument     = errorsmod.Register(ModuleName, 9, "invalid DID document")
	ErrInvalidSignature    = errorsmod.Register(ModuleName, 10, "invalid signature")
	ErrDocumentTooLarge    = errorsmod.Register(ModuleName, 11, "DID document too large")
	ErrTooManyMethods      = errorsmod.Register(ModuleName, 12, "too many verification methods")
	ErrTooManyServices     = errorsmod.Register(ModuleName, 13, "too many services")
	ErrInsufficientFunds   = errorsmod.Register(ModuleName, 14, "insufficient funds for DID operation")
	// Authentication method errors
	ErrInvalidMethodID     = errorsmod.Register(ModuleName, 15, "invalid authentication method ID")
	ErrInvalidMethodType   = errorsmod.Register(ModuleName, 16, "invalid authentication method type")
	ErrInvalidPublicKeyHash = errorsmod.Register(ModuleName, 17, "invalid public key hash")
	ErrAuthMethodNotFound  = errorsmod.Register(ModuleName, 18, "authentication method not found")
	ErrAuthMethodExists    = errorsmod.Register(ModuleName, 19, "authentication method already exists")
	ErrTooManyAuthMethods  = errorsmod.Register(ModuleName, 20, "too many authentication methods")
	ErrPrimaryAuthMethod   = errorsmod.Register(ModuleName, 21, "cannot remove primary authentication method")
)