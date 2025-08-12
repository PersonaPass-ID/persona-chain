package types

import (
	"fmt"
	"time"
	
	sdk "github.com/cosmos/cosmos-sdk/types"
	proto "github.com/cosmos/gogoproto/proto"
)

const (
	ModuleName = "oracle"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

// Oracle represents an external data oracle
type Oracle struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	Description  string            `json:"description"`
	Endpoint     string            `json:"endpoint"`
	Type         OracleType        `json:"type"`
	Owner        string            `json:"owner"`
	Status       OracleStatus      `json:"status"`
	Reputation   float64           `json:"reputation"`
	Created      time.Time         `json:"created"`
	Updated      time.Time         `json:"updated"`
	Config       OracleConfig      `json:"config"`
	Metadata     map[string]string `json:"metadata"`
}

// OracleType represents the type of oracle
type OracleType string

const (
	TypeIdentityVerification OracleType = "identity_verification"
	TypeKYC                  OracleType = "kyc"
	TypeCredentialValidation OracleType = "credential_validation"
	TypeReputationScore      OracleType = "reputation_score"
	TypeBiometricMatch       OracleType = "biometric_match"
	TypeDocumentVerification OracleType = "document_verification"
	TypePriceOracle          OracleType = "price_oracle"
	TypeComplianceCheck      OracleType = "compliance_check"
)

// OracleStatus represents the status of an oracle
type OracleStatus string

const (
	StatusActive     OracleStatus = "active"
	StatusSuspended  OracleStatus = "suspended"
	StatusDeprecated OracleStatus = "deprecated"
	StatusMaintenance OracleStatus = "maintenance"
)

// OracleConfig defines oracle configuration
type OracleConfig struct {
	Timeout          time.Duration     `json:"timeout"`
	RetryAttempts    int               `json:"retry_attempts"`
	RequiredFee      sdk.Coin          `json:"required_fee"`
	ResponseFormat   string            `json:"response_format"`
	AuthRequired     bool              `json:"auth_required"`
	RateLimit        RateLimit         `json:"rate_limit"`
	DataSources      []DataSource      `json:"data_sources"`
	ValidationRules  []ValidationRule  `json:"validation_rules"`
}

// RateLimit defines oracle rate limiting
type RateLimit struct {
	RequestsPerSecond int           `json:"requests_per_second"`
	RequestsPerHour   int           `json:"requests_per_hour"`
	RequestsPerDay    int           `json:"requests_per_day"`
	BurstSize         int           `json:"burst_size"`
	WindowSize        time.Duration `json:"window_size"`
}

// DataSource represents an oracle data source
type DataSource struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	URL         string            `json:"url"`
	Type        string            `json:"type"`
	Weight      float64           `json:"weight"`
	Reliability float64           `json:"reliability"`
	Headers     map[string]string `json:"headers"`
	Params      map[string]string `json:"params"`
}

// ValidationRule defines data validation rules
type ValidationRule struct {
	Field     string      `json:"field"`
	Type      string      `json:"type"`
	Condition string      `json:"condition"`
	Value     interface{} `json:"value"`
	Message   string      `json:"message"`
}

// OracleRequest represents a request to an oracle
type OracleRequest struct {
	ID          string                 `json:"id"`
	OracleID    string                 `json:"oracle_id"`
	Requester   string                 `json:"requester"`
	RequestData map[string]interface{} `json:"request_data"`
	Status      RequestStatus          `json:"status"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
	Response    *OracleResponse        `json:"response,omitempty"`
	Fee         sdk.Coin               `json:"fee"`
	Priority    int                    `json:"priority"`
	Callback    string                 `json:"callback"`
}

// OracleResponse represents an oracle response
type OracleResponse struct {
	ID           string                 `json:"id"`
	RequestID    string                 `json:"request_id"`
	ResponseData map[string]interface{} `json:"response_data"`
	Success      bool                   `json:"success"`
	ErrorMessage string                 `json:"error_message,omitempty"`
	Confidence   float64                `json:"confidence"`
	Sources      []string               `json:"sources"`
	Timestamp    time.Time              `json:"timestamp"`
	Signature    string                 `json:"signature"`
	Evidence     []Evidence             `json:"evidence"`
}

// Evidence provides supporting evidence for oracle responses
type Evidence struct {
	Type      string            `json:"type"`
	Data      string            `json:"data"`
	Hash      string            `json:"hash"`
	Source    string            `json:"source"`
	Timestamp time.Time         `json:"timestamp"`
	Metadata  map[string]string `json:"metadata"`
}

// RequestStatus represents the status of an oracle request
type RequestStatus string

const (
	RequestPending    RequestStatus = "pending"
	RequestProcessing RequestStatus = "processing"
	RequestCompleted  RequestStatus = "completed"
	RequestFailed     RequestStatus = "failed"
	RequestExpired    RequestStatus = "expired"
	RequestCancelled  RequestStatus = "cancelled"
)

// OracleStatistics tracks oracle performance statistics
type OracleStatistics struct {
	OracleID         string    `json:"oracle_id"`
	TotalRequests    uint64    `json:"total_requests"`
	SuccessfulReqs   uint64    `json:"successful_requests"`
	FailedRequests   uint64    `json:"failed_requests"`
	AvgResponseTime  int64     `json:"avg_response_time"` // in milliseconds
	AvgConfidence    float64   `json:"avg_confidence"`
	LastRequest      time.Time `json:"last_request"`
	Uptime           float64   `json:"uptime"`
	ReputationScore  float64   `json:"reputation_score"`
}

// Implement proto.Message interface for SDK compatibility
func (m *Oracle) ProtoMessage()  {}
func (m *Oracle) Reset()         { *m = Oracle{} }
func (m *Oracle) String() string { return proto.CompactTextString(m) }

func (m *OracleRequest) ProtoMessage()  {}
func (m *OracleRequest) Reset()         { *m = OracleRequest{} }
func (m *OracleRequest) String() string { return proto.CompactTextString(m) }

func (m *OracleResponse) ProtoMessage()  {}
func (m *OracleResponse) Reset()         { *m = OracleResponse{} }
func (m *OracleResponse) String() string { return proto.CompactTextString(m) }

func (m *OracleStatistics) ProtoMessage()  {}
func (m *OracleStatistics) Reset()         { *m = OracleStatistics{} }
func (m *OracleStatistics) String() string { return proto.CompactTextString(m) }

var (
	ErrOracleNotFound = fmt.Errorf("oracle not found")
	ErrOracleNotActive = fmt.Errorf("oracle not active")
	ErrRequestNotFound = fmt.Errorf("request not found")
	ErrStatsNotFound = fmt.Errorf("stats not found")
)

// Key prefixes
var (
	OracleKeyPrefix = []byte{0x01}
	RequestKeyPrefix = []byte{0x02}
	StatsKeyPrefix = []byte{0x03}
)

// OracleKey returns the store key for an oracle
func OracleKey(oracleID string) []byte {
	return append(OracleKeyPrefix, []byte(oracleID)...)
}

// RequestKey returns the store key for a request
func RequestKey(requestID string) []byte {
	return append(RequestKeyPrefix, []byte(requestID)...)
}

// StatsKey returns the store key for stats
func StatsKey(oracleID string) []byte {
	return append(StatsKeyPrefix, []byte(oracleID)...)
}

// OracleQuery defines query parameters for oracles
type OracleQuery struct {
	Type   string `json:"type,omitempty"`
	Status string `json:"status,omitempty"`
}

// Validate validates an Oracle
func (o *Oracle) Validate() error {
	if o.ID == "" {
		return fmt.Errorf("oracle ID cannot be empty")
	}
	
	if o.Name == "" {
		return fmt.Errorf("oracle name cannot be empty")
	}
	
	if o.Endpoint == "" {
		return fmt.Errorf("oracle endpoint cannot be empty")
	}
	
	if o.Owner == "" {
		return fmt.Errorf("oracle owner cannot be empty")
	}
	
	return nil
}

// Validate validates an OracleRequest
func (r *OracleRequest) Validate() error {
	if r.ID == "" {
		return fmt.Errorf("request ID cannot be empty")
	}
	
	if r.OracleID == "" {
		return fmt.Errorf("oracle ID cannot be empty")
	}
	
	if r.Requester == "" {
		return fmt.Errorf("requester cannot be empty")
	}
	
	return nil
}

// Validate validates an OracleResponse
func (r *OracleResponse) Validate() error {
	if r.ID == "" {
		return fmt.Errorf("response ID cannot be empty")
	}
	
	if r.RequestID == "" {
		return fmt.Errorf("request ID cannot be empty")
	}
	
	return nil
}