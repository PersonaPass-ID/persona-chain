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
)