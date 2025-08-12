package types

// Event types for the credential module
const (
	EventTypeCredentialCreated    = "credential_created"
	EventTypeCredentialRevoked    = "credential_revoked"
	EventTypePresentationCreated  = "presentation_created"

	// Attribute keys
	AttributeKeyCredentialID   = "credential_id"
	AttributeKeyPresentationID = "presentation_id"
	AttributeKeyIssuer         = "issuer"
	AttributeKeySubject        = "subject"
	AttributeKeyHolder         = "holder"
	AttributeKeyRevoker        = "revoker"
)