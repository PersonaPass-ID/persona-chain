package keeper

import (
	"context"

	"cosmossdk.io/collections"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/PersonaPass-ID/personachain/x/zkproof/types"
)

// EndBlocker is called at the end of each block to perform module-specific operations.
func (k Keeper) EndBlocker(ctx context.Context) error {
	sdkCtx := sdk.UnwrapSDKContext(ctx)
	
	// Check for expired proofs and mark them as expired
	return k.processExpiredProofs(sdkCtx)
}

// processExpiredProofs marks proofs as expired if they have passed their validity period.
func (k Keeper) processExpiredProofs(ctx sdk.Context) error {
	currentTime := ctx.BlockTime()
	
	// Walk through all proofs to check for expiration
	return k.Proofs.Walk(ctx, nil, func(key string, proof types.ZKProof) (bool, error) {
		// Skip if already expired or invalid
		if proof.Status == types.ProofStatusExpired || proof.Status == types.ProofStatusInvalid {
			return false, nil
		}
		
		// Check if proof has expired
		if proof.ValidTo != nil && currentTime.After(*proof.ValidTo) {
			// Update proof status to expired
			proof.Status = types.ProofStatusExpired
			proof.UpdatedAt = currentTime
			
			// Update the proof in storage
			if err := k.Proofs.Set(ctx, proof.Id, proof); err != nil {
				return true, err
			}
			
			// Update status index - remove old status entry and add new one
			oldStatusKey := collections.Join(string(types.ProofStatusPending), proof.Id)
			if proof.Status == types.ProofStatusValid {
				oldStatusKey = collections.Join(string(types.ProofStatusValid), proof.Id)
			}
			k.ProofsByStatus.Remove(ctx, oldStatusKey)
			
			newStatusKey := collections.Join(string(types.ProofStatusExpired), proof.Id)
			if err := k.ProofsByStatus.Set(ctx, newStatusKey, proof.Id); err != nil {
				return true, err
			}
			
			// Emit expiration event
			ctx.EventManager().EmitEvents(sdk.Events{
				sdk.NewEvent(
					"proof_expired",
					sdk.NewAttribute(types.AttributeKeyProofID, proof.Id),
					sdk.NewAttribute(types.AttributeKeyProver, proof.Prover),
					sdk.NewAttribute("expired_at", currentTime.String()),
				),
			})
		}
		
		return false, nil
	})
}