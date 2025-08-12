package types

import (
	"fmt"

	"cosmossdk.io/math"
	"gopkg.in/yaml.v2"
)

// DefaultParams returns default parameters
func DefaultParams() Params {
	return Params{
		DIDCreationFee: math.NewInt(1000000), // 1 PERSONA token
		DIDUpdateFee:   math.NewInt(500000),  // 0.5 PERSONA token
		MaxDIDSize:     16384,                // 16KB max DID document size
		MaxControllers: 10,                   // Max number of controllers per DID
	}
}

// Validate validates parameters
func (p Params) Validate() error {
	if p.DIDCreationFee.IsNegative() {
		return fmt.Errorf("DID creation fee cannot be negative: %s", p.DIDCreationFee)
	}

	if p.DIDUpdateFee.IsNegative() {
		return fmt.Errorf("DID update fee cannot be negative: %s", p.DIDUpdateFee)
	}

	if p.MaxDIDSize <= 0 {
		return fmt.Errorf("max DID size must be positive: %d", p.MaxDIDSize)
	}

	if p.MaxDIDSize > 1024*1024 { // 1MB limit
		return fmt.Errorf("max DID size cannot exceed 1MB: %d", p.MaxDIDSize)
	}

	if p.MaxControllers <= 0 {
		return fmt.Errorf("max controllers must be positive: %d", p.MaxControllers)
	}

	if p.MaxControllers > 100 {
		return fmt.Errorf("max controllers cannot exceed 100: %d", p.MaxControllers)
	}

	return nil
}

// String returns a human readable string representation of the parameters
func (p Params) String() string {
	out, _ := yaml.Marshal(p)
	return string(out)
}

// Params defines the parameters for the DID module
type Params struct {
	// DIDCreationFee defines the fee for creating a new DID
	DIDCreationFee math.Int `json:"did_creation_fee"`
	
	// DIDUpdateFee defines the fee for updating a DID
	DIDUpdateFee math.Int `json:"did_update_fee"`
	
	// MaxDIDSize defines the maximum size of a DID document in bytes
	MaxDIDSize uint64 `json:"max_did_size"`
	
	// MaxControllers defines the maximum number of controllers per DID
	MaxControllers uint64 `json:"max_controllers"`
}

// Ensure Params implements proto.Message interface for SDK compatibility
func (m *Params) Reset()        { *m = Params{} }
func (m *Params) ProtoMessage() {}