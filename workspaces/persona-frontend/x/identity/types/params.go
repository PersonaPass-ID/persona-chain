package types

import (
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
	paramtypes "github.com/cosmos/cosmos-sdk/x/params/types"
	"gopkg.in/yaml.v2"
)

var _ paramtypes.ParamSet = (*Params)(nil)

var (
	KeyMaxCredentialsPerDID = []byte("MaxCredentialsPerDID")
	DefaultMaxCredentialsPerDID uint32 = 100
)

var (
	KeyCredentialFee = []byte("CredentialFee")
	DefaultCredentialFee = sdk.NewCoin("upersona", sdk.NewInt(1000000)) // 1 PERSONA
)

var (
	KeyVerificationFee = []byte("VerificationFee")
	DefaultVerificationFee = sdk.NewCoin("upersona", sdk.NewInt(100000)) // 0.1 PERSONA
)

// ParamKeyTable the param key table for launch module
func ParamKeyTable() paramtypes.KeyTable {
	return paramtypes.NewKeyTable().RegisterParamSet(&Params{})
}

// NewParams creates a new Params instance
func NewParams(
	maxCredentialsPerDID uint32,
	credentialFee sdk.Coin,
	verificationFee sdk.Coin,
) Params {
	return Params{
		MaxCredentialsPerDID: maxCredentialsPerDID,
		CredentialFee:        credentialFee,
		VerificationFee:      verificationFee,
	}
}

// DefaultParams returns a default set of parameters
func DefaultParams() Params {
	return NewParams(
		DefaultMaxCredentialsPerDID,
		DefaultCredentialFee,
		DefaultVerificationFee,
	)
}

// ParamSetPairs get the params.ParamSet
func (p *Params) ParamSetPairs() paramtypes.ParamSetPairs {
	return paramtypes.ParamSetPairs{
		paramtypes.NewParamSetPair(KeyMaxCredentialsPerDID, &p.MaxCredentialsPerDID, validateMaxCredentialsPerDID),
		paramtypes.NewParamSetPair(KeyCredentialFee, &p.CredentialFee, validateCredentialFee),
		paramtypes.NewParamSetPair(KeyVerificationFee, &p.VerificationFee, validateVerificationFee),
	}
}

// Validate validates the set of params
func (p Params) Validate() error {
	if err := validateMaxCredentialsPerDID(p.MaxCredentialsPerDID); err != nil {
		return err
	}

	if err := validateCredentialFee(p.CredentialFee); err != nil {
		return err
	}

	if err := validateVerificationFee(p.VerificationFee); err != nil {
		return err
	}

	return nil
}

// String implements the Stringer interface.
func (p Params) String() string {
	out, _ := yaml.Marshal(p)
	return string(out)
}

// validateMaxCredentialsPerDID validates the MaxCredentialsPerDID param
func validateMaxCredentialsPerDID(v interface{}) error {
	maxCreds, ok := v.(uint32)
	if !ok {
		return fmt.Errorf("invalid parameter type: %T", v)
	}

	if maxCreds == 0 {
		return fmt.Errorf("max credentials per DID must be greater than 0")
	}

	return nil
}

// validateCredentialFee validates the CredentialFee param
func validateCredentialFee(v interface{}) error {
	fee, ok := v.(sdk.Coin)
	if !ok {
		return fmt.Errorf("invalid parameter type: %T", v)
	}

	if !fee.IsValid() {
		return fmt.Errorf("invalid credential fee")
	}

	if fee.IsNegative() {
		return fmt.Errorf("credential fee cannot be negative")
	}

	return nil
}

// validateVerificationFee validates the VerificationFee param
func validateVerificationFee(v interface{}) error {
	fee, ok := v.(sdk.Coin)
	if !ok {
		return fmt.Errorf("invalid parameter type: %T", v)
	}

	if !fee.IsValid() {
		return fmt.Errorf("invalid verification fee")
	}

	if fee.IsNegative() {
		return fmt.Errorf("verification fee cannot be negative")
	}

	return nil
}

// MaxCredentialsPerDID returns the MaxCredentialsPerDID param
func (k Keeper) MaxCredentialsPerDID(ctx sdk.Context) (res uint32) {
	k.paramstore.Get(ctx, KeyMaxCredentialsPerDID, &res)
	return
}

// CredentialFee returns the CredentialFee param
func (k Keeper) CredentialFee(ctx sdk.Context) (res sdk.Coin) {
	k.paramstore.Get(ctx, KeyCredentialFee, &res)
	return
}

// VerificationFee returns the VerificationFee param
func (k Keeper) VerificationFee(ctx sdk.Context) (res sdk.Coin) {
	k.paramstore.Get(ctx, KeyVerificationFee, &res)
	return
}