package types

// DID module event types
const (
	EventTypeCreateDID     = "create_did"
	EventTypeUpdateDID     = "update_did"
	EventTypeDeactivateDID = "deactivate_did"
	EventTypeUpdateParams  = "update_params"

	AttributeKeyDIDID       = "did_id"
	AttributeKeyController  = "controller"
	AttributeKeyCreated     = "created"
	AttributeKeyUpdated     = "updated"
	AttributeKeyDeactivated = "deactivated"
	AttributeKeyAuthority   = "authority"
)