package types

import (
	"encoding/binary"
	"crypto/sha256"
	"fmt"
	"strings"
)

const (
	// DIDPrefix is the prefix for storing DIDs in the KVStore
	DIDPrefix = "did:"

	// DIDByControllerPrefix is the prefix for indexing DIDs by controller
	DIDByControllerPrefix = "did_controller:"

	// DIDMetadataPrefix is the prefix for storing DID metadata
	DIDMetadataPrefix = "did_metadata:"

	// ParamsKey is the key for storing module parameters
	ParamsKey = "params"

	// DIDCountKey is the key for storing the total count of DIDs
	DIDCountKey = "did_count"
)

// DIDKey creates a store key for a DID by ID
func DIDKey(id string) []byte {
	return []byte(DIDPrefix + id)
}

// DIDByControllerKey creates a store key for indexing DIDs by controller
func DIDByControllerKey(controller, id string) []byte {
	return []byte(DIDByControllerPrefix + controller + ":" + id)
}

// DIDMetadataKey creates a store key for DID metadata
func DIDMetadataKey(id string) []byte {
	return []byte(DIDMetadataPrefix + id)
}

// GetDIDIDFromKey extracts the DID ID from a DID store key
func GetDIDIDFromKey(key []byte) string {
	prefixLen := len(DIDPrefix)
	if len(key) <= prefixLen {
		return ""
	}
	return string(key[prefixLen:])
}

// GetControllerFromKey extracts the controller from a DID-by-controller key
func GetControllerFromKey(key []byte) string {
	prefixLen := len(DIDByControllerPrefix)
	if len(key) <= prefixLen {
		return ""
	}
	keyStr := string(key[prefixLen:])
	parts := strings.Split(keyStr, ":")
	if len(parts) < 2 {
		return ""
	}
	return parts[0]
}

// GetDIDIDFromControllerKey extracts the DID ID from a DID-by-controller key
func GetDIDIDFromControllerKey(key []byte) string {
	prefixLen := len(DIDByControllerPrefix)
	if len(key) <= prefixLen {
		return ""
	}
	keyStr := string(key[prefixLen:])
	parts := strings.Split(keyStr, ":")
	if len(parts) < 2 {
		return ""
	}
	return parts[1]
}

// CreateDIDHash creates a hash for DID generation
func CreateDIDHash(controller string, nonce uint64) string {
	data := fmt.Sprintf("%s:%d", controller, nonce)
	hash := sha256.Sum256([]byte(data))
	return fmt.Sprintf("did:persona:%x", hash[:16])
}

// Uint64ToBytes converts uint64 to bytes
func Uint64ToBytes(val uint64) []byte {
	bz := make([]byte, 8)
	binary.BigEndian.PutUint64(bz, val)
	return bz
}

// BytesToUint64 converts bytes to uint64
func BytesToUint64(bz []byte) uint64 {
	if len(bz) != 8 {
		return 0
	}
	return binary.BigEndian.Uint64(bz)
}

// Iterator key functions for pagination and querying

// DIDPrefixKey returns the prefix for DID iteration
func DIDPrefixKey() []byte {
	return []byte(DIDPrefix)
}

// DIDByControllerPrefixKey returns the prefix for controller-based DID iteration
func DIDByControllerPrefixKey(controller string) []byte {
	return []byte(DIDByControllerPrefix + controller + ":")
}

// ParseDIDID validates and parses a DID ID
func ParseDIDID(didID string) error {
	if !strings.HasPrefix(didID, "did:persona:") {
		return ErrInvalidDID
	}
	if len(didID) < 20 {
		return ErrInvalidDID
	}
	return nil
}

// ValidateDIDMethod validates the DID method is supported
func ValidateDIDMethod(didID string) bool {
	return strings.HasPrefix(didID, "did:persona:")
}

// ExtractHashFromDID extracts the hash portion from a DID
func ExtractHashFromDID(didID string) string {
	parts := strings.Split(didID, ":")
	if len(parts) >= 3 {
		return parts[2]
	}
	return ""
}