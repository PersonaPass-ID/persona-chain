package types

import (
	"cosmossdk.io/math"
	"fmt"
)

const (
	ModuleName = "token"
	StoreKey   = ModuleName
	RouterKey  = ModuleName

	// PERSONA token denomination
	PersonaDenom = "persona"
	
	// Token decimals
	PersonaDecimals = 6
	
	// Max supply: 1 billion PERSONA
	MaxSupply = 1_000_000_000_000_000 // 1B with 6 decimals
)

// PersonaToken represents the native PERSONA token
type PersonaToken struct {
	Denom       string   `json:"denom"`
	TotalSupply math.Int `json:"total_supply"`
	MaxSupply   math.Int `json:"max_supply"`
	Decimals    uint32   `json:"decimals"`
}

// TokenParams defines basic token parameters
type TokenParams struct {
	MinStakeAmount  math.Int `json:"min_stake_amount"`  // 100 PERSONA
	ProposalDeposit math.Int `json:"proposal_deposit"`  // 1000 PERSONA
	DIDCreationFee  math.Int `json:"did_creation_fee"`  // 10 PERSONA
}

// Default token configuration
func DefaultPersonaToken() PersonaToken {
	return PersonaToken{
		Denom:       PersonaDenom,
		TotalSupply: math.NewInt(0),
		MaxSupply:   math.NewInt(MaxSupply),
		Decimals:    PersonaDecimals,
	}
}

// Default parameters
func DefaultParams() TokenParams {
	return TokenParams{
		MinStakeAmount:  math.NewInt(100_000_000),   // 100 PERSONA
		ProposalDeposit: math.NewInt(1000_000_000),  // 1000 PERSONA
		DIDCreationFee:  math.NewInt(10_000_000),    // 10 PERSONA
	}
}

// Validation
func (pt *PersonaToken) Validate() error {
	if pt.Denom == "" {
		return fmt.Errorf("token denom cannot be empty")
	}
	if pt.MaxSupply.IsZero() || pt.MaxSupply.IsNegative() {
		return fmt.Errorf("max supply must be positive")
	}
	if pt.TotalSupply.GT(pt.MaxSupply) {
		return fmt.Errorf("total supply cannot exceed max supply")
	}
	return nil
}

func (p *TokenParams) Validate() error {
	if p.MinStakeAmount.IsNegative() {
		return fmt.Errorf("min stake amount cannot be negative")
	}
	if p.ProposalDeposit.IsNegative() {
		return fmt.Errorf("proposal deposit cannot be negative")
	}
	if p.DIDCreationFee.IsNegative() {
		return fmt.Errorf("DID creation fee cannot be negative")
	}
	return nil
}

// Proto message implementations
func (m *PersonaToken) ProtoMessage()  {}
func (m *PersonaToken) Reset()         { *m = PersonaToken{} }
func (m *PersonaToken) String() string { return fmt.Sprintf("PersonaToken{%+v}", *m) }

func (m *TokenParams) ProtoMessage()  {}
func (m *TokenParams) Reset()         { *m = TokenParams{} }
func (m *TokenParams) String() string { return fmt.Sprintf("TokenParams{%+v}", *m) }

// Key prefixes
var (
	TokenConfigKey = []byte{0x01}
	ParamsKey      = []byte{0x02}
)

// Errors
var (
	ErrInvalidToken     = fmt.Errorf("invalid token configuration")
	ErrExceedsMaxSupply = fmt.Errorf("amount exceeds max supply")
)