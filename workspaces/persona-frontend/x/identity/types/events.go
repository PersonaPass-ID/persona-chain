package types

// Identity module event types
const (
	EventTypeIdentityCreated   = "identity_created"
	EventTypeCredentialIssued  = "credential_issued"
	EventTypeCredentialVerified = "credential_verified"
	EventTypeCredentialRevoked  = "credential_revoked"

	AttributeKeyAddress      = "address"
	AttributeKeyDID          = "did"
	AttributeKeyCredentialID = "credential_id"
	AttributeKeyIssuer       = "issuer"
	AttributeKeySubject      = "subject"
	AttributeKeyVerifier     = "verifier"
	AttributeKeyReason       = "reason"

	AttributeValueCategory = ModuleName
)