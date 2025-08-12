package types

import (
	"time"
)

// Identity represents a DID record on PersonaChain
type Identity struct {
	Address     string    `json:"address"`
	DIDDocument string    `json:"did_document"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Credential represents a verifiable credential on PersonaChain
type Credential struct {
	ID             string    `json:"id"`
	Issuer         string    `json:"issuer"`
	SubjectDID     string    `json:"subject_did"`
	CredentialType string    `json:"credential_type"`
	CredentialData string    `json:"credential_data"`
	IssuedAt       time.Time `json:"issued_at"`
	Expiry         time.Time `json:"expiry"`
	Status         string    `json:"status"` // active, revoked, expired
}

// Revocation represents a credential revocation record
type Revocation struct {
	CredentialID string    `json:"credential_id"`
	Issuer       string    `json:"issuer"`
	Reason       string    `json:"reason"`
	RevokedAt    time.Time `json:"revoked_at"`
}

// Verification represents a verification event
type Verification struct {
	ID           string    `json:"id"`
	Verifier     string    `json:"verifier"`
	CredentialID string    `json:"credential_id"`
	ProofData    string    `json:"proof_data"`
	Verified     bool      `json:"verified"`
	VerifiedAt   time.Time `json:"verified_at"`
}

// Params defines the parameters for the identity module
type Params struct {
	// Maximum credentials per DID
	MaxCredentialsPerDID uint32 `json:"max_credentials_per_did"`
	// Fee for credential operations (in uPERSONA)
	CredentialFee sdk.Coin `json:"credential_fee"`
	// Fee for verification (in uPERSONA)
	VerificationFee sdk.Coin `json:"verification_fee"`
}

// DefaultParams returns default parameters
func DefaultParams() Params {
	return Params{
		MaxCredentialsPerDID: 100,
		CredentialFee:        sdk.NewCoin("upersona", sdk.NewInt(1000000)), // 1 PERSONA
		VerificationFee:      sdk.NewCoin("upersona", sdk.NewInt(100000)),  // 0.1 PERSONA
	}
}