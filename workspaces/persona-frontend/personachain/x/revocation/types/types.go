package types

import (
	"fmt"
	"time"
	
	proto "github.com/cosmos/gogoproto/proto"
)

const (
	ModuleName = "revocation"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

// RevocationEntry represents a credential revocation entry
type RevocationEntry struct {
	ID                string            `json:"id"`
	CredentialID      string            `json:"credential_id"`
	RevocationReason  RevocationReason  `json:"revocation_reason"`
	RevocationMethod  RevocationMethod  `json:"revocation_method"`
	Revoker           string            `json:"revoker"`
	RevocationDate    time.Time         `json:"revocation_date"`
	EffectiveDate     time.Time         `json:"effective_date"`
	Evidence          []Evidence        `json:"evidence"`
	Status            RevocationStatus  `json:"status"`
	AppealDeadline    time.Time         `json:"appeal_deadline"`
	Appeals           []Appeal          `json:"appeals"`
	Metadata          map[string]string `json:"metadata"`
}

// RevocationReason represents why a credential was revoked
type RevocationReason string

const (
	ReasonCompromised    RevocationReason = "compromised"
	ReasonExpired        RevocationReason = "expired"
	ReasonSuperseded     RevocationReason = "superseded"
	ReasonSuspicious     RevocationReason = "suspicious"
	ReasonViolation      RevocationReason = "violation"
	ReasonRequest        RevocationReason = "request"
	ReasonError          RevocationReason = "error"
	ReasonFraud          RevocationReason = "fraud"
)

// RevocationMethod represents how the revocation was performed
type RevocationMethod string

const (
	MethodAutomatic   RevocationMethod = "automatic"
	MethodManual      RevocationMethod = "manual"
	MethodAI          RevocationMethod = "ai"
	MethodOracle      RevocationMethod = "oracle"
	MethodConsensus   RevocationMethod = "consensus"
)

// RevocationStatus represents the status of a revocation
type RevocationStatus string

const (
	StatusPending    RevocationStatus = "pending"
	StatusActive     RevocationStatus = "active"
	StatusAppealed   RevocationStatus = "appealed"
	StatusReversed   RevocationStatus = "reversed"
	StatusExpired    RevocationStatus = "expired"
)

// Evidence provides proof for revocation
type Evidence struct {
	Type         string            `json:"type"`
	Description  string            `json:"description"`
	Data         string            `json:"data"`
	Hash         string            `json:"hash"`
	Signature    string            `json:"signature"`
	Provider     string            `json:"provider"`
	Timestamp    time.Time         `json:"timestamp"`
	Verified     bool              `json:"verified"`
	Metadata     map[string]string `json:"metadata"`
}

// Appeal represents an appeal against revocation
type Appeal struct {
	ID           string            `json:"id"`
	Appellant    string            `json:"appellant"`
	Reason       string            `json:"reason"`
	Evidence     []Evidence        `json:"evidence"`
	Status       AppealStatus      `json:"status"`
	SubmittedAt  time.Time         `json:"submitted_at"`
	ReviewedAt   time.Time         `json:"reviewed_at"`
	ReviewedBy   string            `json:"reviewed_by"`
	Decision     string            `json:"decision"`
	Notes        string            `json:"notes"`
}

// AppealStatus represents the status of an appeal
type AppealStatus string

const (
	AppealPending  AppealStatus = "pending"
	AppealApproved AppealStatus = "approved"
	AppealDenied   AppealStatus = "denied"
	AppealExpired  AppealStatus = "expired"
)

// RevocationList represents a revocation list/registry
type RevocationList struct {
	ID            string                   `json:"id"`
	Name          string                   `json:"name"`
	Description   string                   `json:"description"`
	Issuer        string                   `json:"issuer"`
	Type          RevocationListType       `json:"type"`
	Entries       []string                 `json:"entries"` // RevocationEntry IDs
	Created       time.Time                `json:"created"`
	Updated       time.Time                `json:"updated"`
	Version       uint64                   `json:"version"`
	Status        RevocationListStatus     `json:"status"`
	AccessControl RevocationListAccess     `json:"access_control"`
	Metadata      map[string]string        `json:"metadata"`
}

// RevocationListType represents the type of revocation list
type RevocationListType string

const (
	ListTypePublic     RevocationListType = "public"
	ListTypePrivate    RevocationListType = "private"
	ListTypeConsortium RevocationListType = "consortium"
)

// RevocationListStatus represents the status of a revocation list
type RevocationListStatus string

const (
	ListStatusActive     RevocationListStatus = "active"
	ListStatusSuspended  RevocationListStatus = "suspended"
	ListStatusRetired    RevocationListStatus = "retired"
)

// RevocationListAccess defines access control for revocation lists
type RevocationListAccess struct {
	ReadAccess   []string `json:"read_access"`
	WriteAccess  []string `json:"write_access"`
	AdminAccess  []string `json:"admin_access"`
	PublicRead   bool     `json:"public_read"`
}

// Implement proto.Message interface for SDK compatibility
func (m *RevocationEntry) ProtoMessage()  {}
func (m *RevocationEntry) Reset()         { *m = RevocationEntry{} }
func (m *RevocationEntry) String() string { return proto.CompactTextString(m) }

func (m *RevocationList) ProtoMessage()  {}
func (m *RevocationList) Reset()         { *m = RevocationList{} }
func (m *RevocationList) String() string { return proto.CompactTextString(m) }

var (
	ErrRevocationNotFound = fmt.Errorf("revocation not found")
)

// Key prefixes
var (
	RevocationKeyPrefix = []byte{0x01}
)

// RevocationKey returns the store key for a revocation
func RevocationKey(revocationID string) []byte {
	return append(RevocationKeyPrefix, []byte(revocationID)...)
}

// RevocationQuery defines query parameters for revocations
type RevocationQuery struct {
	CredentialID string `json:"credential_id,omitempty"`
	Status       string `json:"status,omitempty"`
}

// Validate validates a RevocationEntry
func (re *RevocationEntry) Validate() error {
	if re.ID == "" {
		return fmt.Errorf("revocation ID cannot be empty")
	}
	
	if re.CredentialID == "" {
		return fmt.Errorf("credential ID cannot be empty")
	}
	
	if re.Revoker == "" {
		return fmt.Errorf("revoker cannot be empty")
	}
	
	return nil
}