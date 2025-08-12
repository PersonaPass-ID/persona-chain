package types

import (
	"fmt"
	"time"
	
	proto "github.com/cosmos/gogoproto/proto"
)

const (
	ModuleName = "schema"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

// CredentialSchema represents a credential schema definition
type CredentialSchema struct {
	ID             string                 `json:"id"`
	Name           string                 `json:"name"`
	Description    string                 `json:"description"`
	Version        string                 `json:"version"`
	Type           string                 `json:"type"`
	Schema         SchemaDefinition       `json:"schema"`
	Metadata       SchemaMetadata         `json:"metadata"`
	Author         string                 `json:"author"`
	Created        time.Time              `json:"created"`
	Updated        time.Time              `json:"updated"`
	Status         SchemaStatus           `json:"status"`
	UsageCount     uint64                 `json:"usage_count"`
	Compliance     []ComplianceStandard   `json:"compliance"`
	Dependencies   []SchemaDependency     `json:"dependencies"`
	Examples       []SchemaExample        `json:"examples"`
}

// SchemaDefinition contains the JSON schema definition
type SchemaDefinition struct {
	JSONSchema      string                 `json:"json_schema"`
	Properties      map[string]Property    `json:"properties"`
	Required        []string               `json:"required"`
	AdditionalProps bool                   `json:"additional_properties"`
	Constraints     []Constraint           `json:"constraints"`
}

// Property defines a schema property
type Property struct {
	Type        string      `json:"type"`
	Description string      `json:"description"`
	Format      string      `json:"format"`
	Pattern     string      `json:"pattern"`
	Minimum     *float64    `json:"minimum,omitempty"`
	Maximum     *float64    `json:"maximum,omitempty"`
	MinLength   *int        `json:"min_length,omitempty"`
	MaxLength   *int        `json:"max_length,omitempty"`
	Enum        []string    `json:"enum,omitempty"`
	Default     interface{} `json:"default,omitempty"`
	Examples    []string    `json:"examples,omitempty"`
}

// Constraint defines validation constraints
type Constraint struct {
	Type        string      `json:"type"`
	Field       string      `json:"field"`
	Value       interface{} `json:"value"`
	Message     string      `json:"message"`
	Severity    string      `json:"severity"`
}

// SchemaMetadata contains additional schema information
type SchemaMetadata struct {
	Category        string            `json:"category"`
	Tags            []string          `json:"tags"`
	Industry        string            `json:"industry"`
	Jurisdiction    string            `json:"jurisdiction"`
	Language        string            `json:"language"`
	Purpose         string            `json:"purpose"`
	Audience        string            `json:"audience"`
	Website         string            `json:"website"`
	Documentation   string            `json:"documentation"`
	SupportContact  string            `json:"support_contact"`
	License         string            `json:"license"`
	Pricing         PricingModel      `json:"pricing"`
	Attributes      map[string]string `json:"attributes"`
}

// PricingModel defines schema usage pricing
type PricingModel struct {
	Type         string  `json:"type"` // free, paid, subscription
	Cost         float64 `json:"cost"`
	Currency     string  `json:"currency"`
	Billing      string  `json:"billing"` // per-use, monthly, yearly
	FreeLimit    uint64  `json:"free_limit"`
	Description  string  `json:"description"`
}

// ComplianceStandard represents compliance standards
type ComplianceStandard struct {
	Standard    string `json:"standard"`
	Version     string `json:"version"`
	Certified   bool   `json:"certified"`
	CertifiedBy string `json:"certified_by"`
	ValidUntil  time.Time `json:"valid_until"`
}

// SchemaDependency represents schema dependencies
type SchemaDependency struct {
	SchemaID string `json:"schema_id"`
	Version  string `json:"version"`
	Required bool   `json:"required"`
	Reason   string `json:"reason"`
}

// SchemaExample provides usage examples
type SchemaExample struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Data        map[string]interface{} `json:"data"`
	Valid       bool                   `json:"valid"`
	Notes       string                 `json:"notes"`
}

// SchemaStatus represents the status of a schema
type SchemaStatus string

const (
	StatusDraft      SchemaStatus = "draft"
	StatusActive     SchemaStatus = "active"
	StatusDeprecated SchemaStatus = "deprecated"
	StatusRetired    SchemaStatus = "retired"
)

// SchemaUsage tracks schema usage statistics
type SchemaUsage struct {
	SchemaID       string    `json:"schema_id"`
	UserID         string    `json:"user_id"`
	CredentialID   string    `json:"credential_id"`
	UsageType      string    `json:"usage_type"` // issue, verify, validate
	Timestamp      time.Time `json:"timestamp"`
	Success        bool      `json:"success"`
	ErrorMessage   string    `json:"error_message,omitempty"`
	ValidationTime int64     `json:"validation_time"` // in milliseconds
}

// Implement proto.Message interface for SDK compatibility
func (m *CredentialSchema) ProtoMessage()  {}
func (m *CredentialSchema) Reset()         { *m = CredentialSchema{} }
func (m *CredentialSchema) String() string { return proto.CompactTextString(m) }

func (m *SchemaDefinition) ProtoMessage()  {}
func (m *SchemaDefinition) Reset()         { *m = SchemaDefinition{} }
func (m *SchemaDefinition) String() string { return proto.CompactTextString(m) }

var (
	ErrSchemaNotFound = fmt.Errorf("schema not found")
)

// Key prefixes
var (
	SchemaKeyPrefix = []byte{0x01}
)

// SchemaKey returns the store key for a schema
func SchemaKey(schemaID string) []byte {
	return append(SchemaKeyPrefix, []byte(schemaID)...)
}

// SchemaQuery defines query parameters for schemas
type SchemaQuery struct {
	SchemaType string `json:"schema_type,omitempty"`
	Version    string `json:"version,omitempty"`
}

// Validate validates a CredentialSchema
func (cs *CredentialSchema) Validate() error {
	if cs.ID == "" {
		return fmt.Errorf("schema ID cannot be empty")
	}
	
	if cs.Name == "" {
		return fmt.Errorf("schema name cannot be empty")
	}
	
	if cs.Author == "" {
		return fmt.Errorf("schema author cannot be empty")
	}
	
	if cs.Schema.JSONSchema == "" {
		return fmt.Errorf("JSON schema cannot be empty")
	}
	
	return nil
}