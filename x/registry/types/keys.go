package types

import "fmt"

// Constants for store keys
var (
	IdentityPrefix      = []byte{0x01}
	DIDToRegistryPrefix = []byte{0x02}
	OwnerIndexPrefix    = []byte{0x03}
	TypeIndexPrefix     = []byte{0x04}
	StatusIndexPrefix   = []byte{0x05}
)

// GetIdentityKey returns the key for storing an identity registry entry
func GetIdentityKey(id string) []byte {
	return append(IdentityPrefix, []byte(id)...)
}

// GetDIDToRegistryKey returns the key for DID to registry ID mapping
func GetDIDToRegistryKey(did string) []byte {
	return append(DIDToRegistryPrefix, []byte(did)...)
}

// GetOwnerToRegistryKey returns the key for owner to registry ID mapping
func GetOwnerToRegistryKey(owner string) []byte {
	return append(OwnerIndexPrefix, []byte(owner)...)
}

// GetTypeIndexKey returns the key for type index
func GetTypeIndexKey(identityType, id string) []byte {
	return append(TypeIndexPrefix, []byte(fmt.Sprintf("%s/%s", identityType, id))...)
}

// GetStatusIndexKey returns the key for status index
func GetStatusIndexKey(status, id string) []byte {
	return append(StatusIndexPrefix, []byte(fmt.Sprintf("%s/%s", status, id))...)
}