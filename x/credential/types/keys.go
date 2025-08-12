package types

import (
	"crypto/sha256"
	"encoding/binary"
	"fmt"
	"strings"
	
	"cosmossdk.io/collections"
)

const (
	// StoreKey defines the primary module store key
	StoreKey = ModuleName

	// MemStoreKey defines the in-memory store key
	MemStoreKey = "mem_credential"

)

// Collections prefixes for type-safe storage
var (
	// Core storage prefixes
	CredentialPrefix         = collections.NewPrefix(1)
	PresentationPrefix       = collections.NewPrefix(2)
	
	// Counter prefixes  
	CredentialCountKey       = collections.NewPrefix(10)
	PresentationCountKey     = collections.NewPrefix(11)
	
	// Index prefixes
	CredentialByIssuerPrefix = collections.NewPrefix(20)
	CredentialByHolderPrefix = collections.NewPrefix(21)
	CredentialByTypePrefix   = collections.NewPrefix(22)
	CredentialBySchemaPrefix = collections.NewPrefix(23)
	PresentationByHolderPrefix = collections.NewPrefix(24)
	
	// Parameter and metadata prefixes
	ParamsKey                = collections.NewPrefix(30)
	CredentialMetadataPrefix = collections.NewPrefix(31)
	RevocationListPrefix     = collections.NewPrefix(32)
)

// Legacy string prefixes for compatibility
const (
	// LegacyCredentialPrefix is the legacy string prefix for credentials
	LegacyCredentialPrefix = "credential/"

	// LegacyCredentialByIssuerPrefix is the legacy prefix for credential by issuer index
	LegacyCredentialByIssuerPrefix = "credential_issuer/"

	// LegacyCredentialByHolderPrefix is the legacy prefix for credential by holder index
	LegacyCredentialByHolderPrefix = "credential_holder/"

	// LegacyCredentialByTypePrefix is the legacy prefix for credential by type index
	LegacyCredentialByTypePrefix = "credential_type/"

	// LegacyCredentialBySchemaPrefix is the legacy prefix for credential by schema index
	LegacyCredentialBySchemaPrefix = "credential_schema/"

	// LegacyPresentationPrefix is the legacy prefix for presentations
	LegacyPresentationPrefix = "presentation/"

	// LegacyPresentationByHolderPrefix is the legacy prefix for presentation by holder index
	LegacyPresentationByHolderPrefix = "presentation_holder/"

	// LegacyCredentialMetadataPrefix is the legacy prefix for credential metadata
	LegacyCredentialMetadataPrefix = "credential_metadata/"

	// LegacyRevocationListPrefix is the legacy prefix for revocation lists
	LegacyRevocationListPrefix = "revocation_list/"
)

// CredentialKey creates a store key for a credential by ID
func CredentialKey(id string) []byte {
	return []byte(LegacyCredentialPrefix + id)
}

// CredentialByIssuerKey creates a store key for indexing credentials by issuer
func CredentialByIssuerKey(issuer, id string) []byte {
	return []byte(LegacyCredentialByIssuerPrefix + issuer + ":" + id)
}

// CredentialByHolderKey creates a store key for indexing credentials by holder
func CredentialByHolderKey(holder, id string) []byte {
	return []byte(LegacyCredentialByHolderPrefix + holder + ":" + id)
}

// CredentialByTypeKey creates a store key for indexing credentials by type
func CredentialByTypeKey(credType, id string) []byte {
	return []byte(LegacyCredentialByTypePrefix + credType + ":" + id)
}

// CredentialBySchemaKey creates a store key for indexing credentials by schema
func CredentialBySchemaKey(schema, id string) []byte {
	return []byte(LegacyCredentialBySchemaPrefix + schema + ":" + id)
}

// PresentationKey creates a store key for a presentation by ID
func PresentationKey(id string) []byte {
	return []byte(LegacyPresentationPrefix + id)
}

// PresentationByHolderKey creates a store key for indexing presentations by holder
func PresentationByHolderKey(holder, id string) []byte {
	return []byte(LegacyPresentationByHolderPrefix + holder + ":" + id)
}

// CredentialMetadataKey creates a store key for credential metadata
func CredentialMetadataKey(id string) []byte {
	return []byte(LegacyCredentialMetadataPrefix + id)
}

// RevocationListKey creates a store key for a revocation list
func RevocationListKey(issuer string) []byte {
	return []byte(LegacyRevocationListPrefix + issuer)
}

// Key extraction functions

// GetCredentialIDFromKey extracts the credential ID from a credential store key
func GetCredentialIDFromKey(key []byte) string {
	prefixLen := len(LegacyCredentialPrefix)
	if len(key) <= prefixLen {
		return ""
	}
	return string(key[prefixLen:])
}

// GetIssuerFromKey extracts the issuer from a credential-by-issuer key
func GetIssuerFromKey(key []byte) string {
	prefixLen := len(LegacyCredentialByIssuerPrefix)
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

// GetCredentialIDFromIssuerKey extracts the credential ID from a credential-by-issuer key
func GetCredentialIDFromIssuerKey(key []byte) string {
	prefixLen := len(LegacyCredentialByIssuerPrefix)
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

// GetHolderFromKey extracts the holder from a credential-by-holder key
func GetHolderFromKey(key []byte) string {
	prefixLen := len(LegacyCredentialByHolderPrefix)
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

// GetCredentialIDFromHolderKey extracts the credential ID from a credential-by-holder key
func GetCredentialIDFromHolderKey(key []byte) string {
	prefixLen := len(LegacyCredentialByHolderPrefix)
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

// CreateCredentialHash creates a hash for credential generation
func CreateCredentialHash(issuer string, subject string, nonce uint64) string {
	data := fmt.Sprintf("%s:%s:%d", issuer, subject, nonce)
	hash := sha256.Sum256([]byte(data))
	return fmt.Sprintf("urn:persona:credential:%x", hash[:16])
}

// CreatePresentationHash creates a hash for presentation generation
func CreatePresentationHash(holder string, nonce uint64) string {
	data := fmt.Sprintf("%s:%d", holder, nonce)
	hash := sha256.Sum256([]byte(data))
	return fmt.Sprintf("urn:persona:presentation:%x", hash[:16])
}

// Utility functions for byte conversion

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

// CredentialPrefixKey returns the prefix for credential iteration
func CredentialPrefixKey() []byte {
	return []byte(LegacyCredentialPrefix)
}

// CredentialByIssuerPrefixKey returns the prefix for issuer-based credential iteration
func CredentialByIssuerPrefixKey(issuer string) []byte {
	return []byte(LegacyCredentialByIssuerPrefix + issuer + ":")
}

// CredentialByHolderPrefixKey returns the prefix for holder-based credential iteration
func CredentialByHolderPrefixKey(holder string) []byte {
	return []byte(LegacyCredentialByHolderPrefix + holder + ":")
}

// CredentialByTypePrefixKey returns the prefix for type-based credential iteration
func CredentialByTypePrefixKey(credType string) []byte {
	return []byte(LegacyCredentialByTypePrefix + credType + ":")
}

// PresentationPrefixKey returns the prefix for presentation iteration
func PresentationPrefixKey() []byte {
	return []byte(LegacyPresentationPrefix)
}

// PresentationByHolderPrefixKey returns the prefix for holder-based presentation iteration
func PresentationByHolderPrefixKey(holder string) []byte {
	return []byte(LegacyPresentationByHolderPrefix + holder + ":")
}

// Validation functions

// ParseCredentialID validates and parses a credential ID
func ParseCredentialID(credID string) error {
	if !strings.HasPrefix(credID, "urn:persona:credential:") {
		return ErrInvalidCredential
	}
	if len(credID) < 30 {
		return ErrInvalidCredential
	}
	return nil
}

// ValidateCredentialType validates the credential type is supported
func ValidateCredentialType(credType string) bool {
	supportedTypes := map[string]bool{
		"VerifiableCredential": true,
		"PersonaCredential":    true,
		"EducationCredential":  true,
		"IdentityCredential":   true,
		"ProofOfAddress":       true,
		"ProofOfIncome":        true,
		"EmailCredential":      true,
		"PhoneCredential":      true,
	}
	return supportedTypes[credType]
}

// ExtractHashFromCredential extracts the hash portion from a credential ID
func ExtractHashFromCredential(credID string) string {
	parts := strings.Split(credID, ":")
	if len(parts) >= 4 {
		return parts[3]
	}
	return ""
}