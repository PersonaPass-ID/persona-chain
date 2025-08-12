package types

import (
	"fmt"
	"time"
	
	proto "github.com/cosmos/gogoproto/proto"
)

const (
	ModuleName = "registry"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

// IdentityRegistry represents a global identity registry entry
type IdentityRegistry struct {
	ID          string                 `json:"id"`
	DID         string                 `json:"did"`
	Status      RegistryStatus         `json:"status"`
	Metadata    IdentityMetadata       `json:"metadata"`
	Credentials []CredentialReference  `json:"credentials"`
	Created     time.Time              `json:"created"`
	Updated     time.Time              `json:"updated"`
	Expires     time.Time              `json:"expires"`
	Owner       string                 `json:"owner"`
	Reputation  ReputationScore        `json:"reputation"`
	Attributes  map[string]interface{} `json:"attributes"`
}

// IdentityMetadata contains metadata about an identity
type IdentityMetadata struct {
	Name         string            `json:"name"`
	Description  string            `json:"description"`
	Type         IdentityType      `json:"type"`
	Categories   []string          `json:"categories"`
	Tags         []string          `json:"tags"`
	Website      string            `json:"website"`
	Logo         string            `json:"logo"`
	SocialLinks  map[string]string `json:"social_links"`
	Jurisdiction string            `json:"jurisdiction"`
	Language     string            `json:"language"`
}

// CredentialReference references a credential in the credential module
type CredentialReference struct {
	ID          string    `json:"id"`
	Type        string    `json:"type"`
	Schema      string    `json:"schema"`
	Issuer      string    `json:"issuer"`
	Status      string    `json:"status"`
	IssuedDate  time.Time `json:"issued_date"`
	ExpiryDate  time.Time `json:"expiry_date"`
	Verified    bool      `json:"verified"`
}

// ReputationScore tracks identity reputation
type ReputationScore struct {
	Overall       float64            `json:"overall"`
	Credentials   float64            `json:"credentials"`
	Transactions  float64            `json:"transactions"`
	Community     float64            `json:"community"`
	Verification  float64            `json:"verification"`
	History       []ReputationEvent  `json:"history"`
	LastUpdated   time.Time          `json:"last_updated"`
}

// ReputationEvent represents a reputation change event
type ReputationEvent struct {
	Type        string    `json:"type"`
	Impact      float64   `json:"impact"`
	Reason      string    `json:"reason"`
	Source      string    `json:"source"`
	Timestamp   time.Time `json:"timestamp"`
	Evidence    string    `json:"evidence"`
}

// RegistryStatus represents the status of an identity in the registry
type RegistryStatus string

const (
	StatusActive     RegistryStatus = "active"
	StatusSuspended  RegistryStatus = "suspended"
	StatusRevoked    RegistryStatus = "revoked"
	StatusPending    RegistryStatus = "pending"
	StatusExpired    RegistryStatus = "expired"
	StatusMigrated   RegistryStatus = "migrated"
)

// IdentityType represents the type of identity
type IdentityType string

const (
	TypeIndividual   IdentityType = "individual"
	TypeOrganization IdentityType = "organization"
	TypeDevice       IdentityType = "device"
	TypeService      IdentityType = "service"
	TypeGovernment   IdentityType = "government"
	TypeEducational  IdentityType = "educational"
)

// RegistryQuery represents a query against the identity registry
type RegistryQuery struct {
	Filters    map[string]interface{} `json:"filters"`
	Sort       string                 `json:"sort"`
	Order      string                 `json:"order"`
	Limit      uint64                 `json:"limit"`
	Offset     uint64                 `json:"offset"`
	IncludeAll bool                   `json:"include_all"`
}

// RegistryStatistics contains registry statistics
type RegistryStatistics struct {
	TotalIdentities    uint64            `json:"total_identities"`
	ActiveIdentities   uint64            `json:"active_identities"`
	SuspendedIdentities uint64           `json:"suspended_identities"`
	RevokedIdentities  uint64            `json:"revoked_identities"`
	ByType            map[string]uint64  `json:"by_type"`
	ByStatus          map[string]uint64  `json:"by_status"`
	ByJurisdiction    map[string]uint64  `json:"by_jurisdiction"`
	ReputationAverage float64            `json:"reputation_average"`
	LastUpdated       time.Time          `json:"last_updated"`
}

// Implement proto.Message interface for SDK compatibility
func (m *IdentityRegistry) ProtoMessage()  {}
func (m *IdentityRegistry) Reset()         { *m = IdentityRegistry{} }
func (m *IdentityRegistry) String() string { return proto.CompactTextString(m) }

func (m *IdentityMetadata) ProtoMessage()  {}
func (m *IdentityMetadata) Reset()         { *m = IdentityMetadata{} }
func (m *IdentityMetadata) String() string { return proto.CompactTextString(m) }

func (m *ReputationScore) ProtoMessage()  {}
func (m *ReputationScore) Reset()         { *m = ReputationScore{} }
func (m *ReputationScore) String() string { return proto.CompactTextString(m) }

var (
	ErrRegistryNotFound = fmt.Errorf("identity registry not found")
)

// RegistryKey returns the store key for a registry entry (legacy compatibility)
func RegistryKey(registryID string) []byte {
	return GetIdentityKey(registryID)
}

// Validate validates an IdentityRegistry
func (ir *IdentityRegistry) Validate() error {
	if ir.ID == "" {
		return fmt.Errorf("registry ID cannot be empty")
	}
	
	if ir.DID == "" {
		return fmt.Errorf("DID cannot be empty")
	}
	
	if ir.Owner == "" {
		return fmt.Errorf("owner cannot be empty")
	}
	
	return nil
}