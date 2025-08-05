package types

const (
	// ModuleName defines the module name
	ModuleName = "identity"

	// StoreKey defines the primary module store key
	StoreKey = ModuleName

	// RouterKey defines the module's message routing key
	RouterKey = ModuleName

	// QuerierRoute defines the module's query routing key
	QuerierRoute = ModuleName

	// MemStoreKey defines the in-memory store key
	MemStoreKey = "mem_identity"
)

// Store key prefixes
var (
	// IdentityKeyPrefix - prefix for identity records
	IdentityKeyPrefix = []byte{0x01}

	// CredentialKeyPrefix - prefix for credential records
	CredentialKeyPrefix = []byte{0x02}

	// CredentialIDIndexKeyPrefix - prefix for credential ID index
	CredentialIDIndexKeyPrefix = []byte{0x03}

	// RevocationKeyPrefix - prefix for revocation records
	RevocationKeyPrefix = []byte{0x04}

	// VerificationKeyPrefix - prefix for verification records
	VerificationKeyPrefix = []byte{0x05}

	// ParamsKey - prefix for module parameters
	ParamsKey = []byte{0x06}
)

// GetIdentityKey returns the key for an identity record
func GetIdentityKey(address string) []byte {
	return append(IdentityKeyPrefix, []byte(address)...)
}

// GetCredentialKey returns the key for a credential record
func GetCredentialKey(credentialID string) []byte {
	return append(CredentialKeyPrefix, []byte(credentialID)...)
}

// GetCredentialIDIndexKey returns the key for credential ID index
func GetCredentialIDIndexKey(subjectDID string, credentialID string) []byte {
	return append(append(CredentialIDIndexKeyPrefix, []byte(subjectDID)...), []byte(credentialID)...)
}

// GetRevocationKey returns the key for a revocation record
func GetRevocationKey(credentialID string) []byte {
	return append(RevocationKeyPrefix, []byte(credentialID)...)
}

// GetVerificationKey returns the key for a verification record
func GetVerificationKey(verificationID string) []byte {
	return append(VerificationKeyPrefix, []byte(verificationID)...)
}