package types

import (
	"fmt"
	"time"

	"cosmossdk.io/math"
	"github.com/cosmos/gogoproto/proto"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

const (
	// ModuleName defines the module name
	ModuleName = "credential"
)

// W3C Verifiable Credential types with SDK compatibility

// VerifiableCredential represents a W3C Verifiable Credential
type VerifiableCredential struct {
	// Context is the JSON-LD context
	Context []string `json:"@context"`
	
	// ID is the credential identifier
	ID string `json:"id"`
	
	// Type specifies the credential type
	Type []string `json:"type"`
	
	// Issuer is the credential issuer (DID)
	Issuer string `json:"issuer"`
	
	// IssuanceDate when the credential was issued
	IssuanceDate time.Time `json:"issuanceDate"`
	
	// ExpirationDate when the credential expires (optional)
	ExpirationDate *time.Time `json:"expirationDate,omitempty"`
	
	// CredentialSubject contains the claims
	CredentialSubject CredentialSubject `json:"credentialSubject"`
	
	// Proof contains the cryptographic proof
	Proof *Proof `json:"proof,omitempty"`
	
	// Status information for revocation
	CredentialStatus *CredentialStatus `json:"credentialStatus,omitempty"`
	
	// Blockchain specific fields
	BlockHeight int64     `json:"blockHeight"`
	TxHash      string    `json:"txHash"`
	Created     time.Time `json:"created"`
	Updated     time.Time `json:"updated"`
	Active      bool      `json:"active"`
	Revoked     bool      `json:"revoked"`
	RevokedAt   *time.Time `json:"revokedAt,omitempty"`
}

// CredentialSubject represents the subject of a credential
type CredentialSubject struct {
	// ID of the credential subject (usually a DID)
	ID string `json:"id"`
	
	// Claims contains the actual credential claims as JSON
	Claims map[string]interface{} `json:"claims"`
}

// Proof represents a cryptographic proof
type Proof struct {
	// Type of proof (e.g., "Ed25519Signature2020")
	Type string `json:"type"`
	
	// Created timestamp
	Created time.Time `json:"created"`
	
	// VerificationMethod used for the proof
	VerificationMethod string `json:"verificationMethod"`
	
	// ProofPurpose (e.g., "assertionMethod")
	ProofPurpose string `json:"proofPurpose"`
	
	// ProofValue contains the actual signature/proof
	ProofValue string `json:"proofValue"`
}

// CredentialStatus represents revocation status information
type CredentialStatus struct {
	// ID of the status
	ID string `json:"id"`
	
	// Type of status mechanism
	Type string `json:"type"`
	
	// Additional status properties
	StatusListIndex *int    `json:"statusListIndex,omitempty"`
	StatusPurpose   *string `json:"statusPurpose,omitempty"`
}

// VerifiablePresentation represents a W3C Verifiable Presentation
type VerifiablePresentation struct {
	// Context is the JSON-LD context
	Context []string `json:"@context"`
	
	// ID is the presentation identifier
	ID string `json:"id"`
	
	// Type specifies the presentation type
	Type []string `json:"type"`
	
	// Holder is the entity that presents the credentials
	Holder string `json:"holder"`
	
	// VerifiableCredential contains the presented credentials
	VerifiableCredential []string `json:"verifiableCredential"`
	
	// Proof contains the cryptographic proof
	Proof *Proof `json:"proof,omitempty"`
	
	// Blockchain specific fields
	Created time.Time `json:"created"`
}

// Credential metadata for blockchain storage
type CredentialMetadata struct {
	ID          string                 `json:"id"`
	Issuer      string                 `json:"issuer"`
	Subject     string                 `json:"subject"`
	Schema      string                 `json:"schema,omitempty"`
	Tags        []string               `json:"tags,omitempty"`
	Properties  map[string]interface{} `json:"properties,omitempty"`
	BlockHeight int64                  `json:"blockHeight"`
	Created     time.Time              `json:"created"`
}

// Validate validates a verifiable credential
func (vc *VerifiableCredential) Validate() error {
	if vc.ID == "" {
		return ErrInvalidCredential.Wrap("credential ID cannot be empty")
	}

	if vc.Issuer == "" {
		return ErrInvalidIssuer.Wrap("issuer cannot be empty")
	}

	if len(vc.Type) == 0 {
		return ErrInvalidCredential.Wrap("credential type cannot be empty")
	}

	if len(vc.Context) == 0 {
		return ErrInvalidCredential.Wrap("credential context cannot be empty")
	}

	if vc.CredentialSubject.ID == "" {
		return ErrInvalidCredential.Wrap("credential subject ID cannot be empty")
	}

	if vc.IssuanceDate.IsZero() {
		return ErrInvalidCredential.Wrap("issuance date cannot be zero")
	}

	if vc.ExpirationDate != nil && vc.ExpirationDate.Before(vc.IssuanceDate) {
		return ErrExpiredCredential.Wrap("expiration date cannot be before issuance date")
	}

	return nil
}

// IsExpired checks if the credential is expired
func (vc *VerifiableCredential) IsExpired() bool {
	if vc.ExpirationDate == nil {
		return false
	}
	return time.Now().After(*vc.ExpirationDate)
}

// Validate validates a verifiable presentation
func (vp *VerifiablePresentation) Validate() error {
	if vp.ID == "" {
		return ErrInvalidPresentation.Wrap("presentation ID cannot be empty")
	}

	if vp.Holder == "" {
		return ErrInvalidHolder.Wrap("holder cannot be empty")
	}

	if len(vp.Type) == 0 {
		return ErrInvalidPresentation.Wrap("presentation type cannot be empty")
	}

	if len(vp.Context) == 0 {
		return ErrInvalidPresentation.Wrap("presentation context cannot be empty")
	}

	if len(vp.VerifiableCredential) == 0 {
		return ErrInvalidPresentation.Wrap("presentation must contain at least one credential")
	}

	return nil
}

// Ensure all types implement proto.Message interface for SDK compatibility
func (m *VerifiableCredential) ProtoMessage()     {}
func (m *VerifiableCredential) Reset()            { *m = VerifiableCredential{} }
func (m *VerifiableCredential) String() string    { return proto.CompactTextString(m) }

func (m *CredentialSubject) ProtoMessage()  {}
func (m *CredentialSubject) Reset()         { *m = CredentialSubject{} }
func (m *CredentialSubject) String() string { return proto.CompactTextString(m) }

func (m *Proof) ProtoMessage()  {}
func (m *Proof) Reset()         { *m = Proof{} }
func (m *Proof) String() string { return proto.CompactTextString(m) }

func (m *CredentialStatus) ProtoMessage()  {}
func (m *CredentialStatus) Reset()         { *m = CredentialStatus{} }
func (m *CredentialStatus) String() string { return proto.CompactTextString(m) }

func (m *VerifiablePresentation) ProtoMessage()     {}
func (m *VerifiablePresentation) Reset()            { *m = VerifiablePresentation{} }
func (m *VerifiablePresentation) String() string    { return proto.CompactTextString(m) }

func (m *CredentialMetadata) ProtoMessage()  {}
func (m *CredentialMetadata) Reset()         { *m = CredentialMetadata{} }
func (m *CredentialMetadata) String() string { return proto.CompactTextString(m) }

// Params represents module parameters
type Params struct {
	// Maximum credential size in bytes
	MaxCredentialSize uint64 `json:"maxCredentialSize"`
	// Fee for creating credentials
	CreateCredentialFee sdk.Coins `json:"createCredentialFee"`
	// Fee for creating presentations  
	CreatePresentationFee sdk.Coins `json:"createPresentationFee"`
}

// DefaultParams returns default parameters
func DefaultParams() Params {
	return Params{
		MaxCredentialSize:     10000, // 10KB max
		CreateCredentialFee:   sdk.NewCoins(sdk.NewCoin("upersona", math.NewInt(1000))),
		CreatePresentationFee: sdk.NewCoins(sdk.NewCoin("upersona", math.NewInt(500))),
	}
}

// Validate validates parameters
func (p Params) Validate() error {
	if p.MaxCredentialSize == 0 {
		return fmt.Errorf("max credential size cannot be zero")
	}
	return nil
}

// Implement proto.Message interface for Params
func (m *Params) ProtoMessage()  {}
func (m *Params) Reset()         { *m = Params{} }
func (m *Params) String() string { return proto.CompactTextString(m) }