package types

import (
	"fmt"
	"time"
	
	proto "github.com/cosmos/gogoproto/proto"
)

const (
	ModuleName = "did"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

// DIDDocument represents a W3C DID Document
type DIDDocument struct {
	ID                     string                 `json:"id"`
	Context                []string               `json:"@context"`
	VerificationMethod     []VerificationMethod   `json:"verificationMethod"`
	Authentication         []string               `json:"authentication"`
	AssertionMethod        []string               `json:"assertionMethod"`
	KeyAgreement           []string               `json:"keyAgreement"`
	CapabilityInvocation   []string               `json:"capabilityInvocation"`
	CapabilityDelegation   []string               `json:"capabilityDelegation"`
	Service                []Service              `json:"service"`
	Created                time.Time              `json:"created"`
	Updated                time.Time              `json:"updated"`
	Deactivated            bool                   `json:"deactivated"`
	VersionID              string                 `json:"versionId"`
	NextVersionID          string                 `json:"nextVersionId"`
	PreviousVersionID      string                 `json:"previousVersionId"`
}

// VerificationMethod represents a DID verification method
type VerificationMethod struct {
	ID                 string `json:"id"`
	Type               string `json:"type"`
	Controller         string `json:"controller"`
	PublicKeyMultibase string `json:"publicKeyMultibase"`
}

// Service represents a DID service
type Service struct {
	ID              string   `json:"id"`
	Type            string   `json:"type"`
	ServiceEndpoint []string `json:"serviceEndpoint"`
}


// DIDMetadata contains metadata about a DID
type DIDMetadata struct {
	VersionID   string    `json:"versionId"`
	Created     time.Time `json:"created"`
	Updated     time.Time `json:"updated"`
	Deactivated bool      `json:"deactivated"`
}

// Implement proto.Message interface for SDK compatibility
func (m *DIDDocument) ProtoMessage()  {}
func (m *DIDDocument) Reset()         { *m = DIDDocument{} }
func (m *DIDDocument) String() string { return proto.CompactTextString(m) }

func (m *VerificationMethod) ProtoMessage()  {}
func (m *VerificationMethod) Reset()         { *m = VerificationMethod{} }
func (m *VerificationMethod) String() string { return proto.CompactTextString(m) }

func (m *Service) ProtoMessage()  {}
func (m *Service) Reset()         { *m = Service{} }
func (m *Service) String() string { return proto.CompactTextString(m) }


func (m *DIDMetadata) ProtoMessage()  {}
func (m *DIDMetadata) Reset()         { *m = DIDMetadata{} }
func (m *DIDMetadata) String() string { return proto.CompactTextString(m) }

// Validate validates a DID Document
func (d *DIDDocument) Validate() error {
	if d.ID == "" {
		return fmt.Errorf("DID ID cannot be empty")
	}
	
	if len(d.Context) == 0 {
		return fmt.Errorf("DID context cannot be empty")
	}
	
	if len(d.VerificationMethod) == 0 {
		return fmt.Errorf("DID must have at least one verification method")
	}
	
	return nil
}

