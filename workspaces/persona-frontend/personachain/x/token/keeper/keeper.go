package keeper

import (
	"context"
	"cosmossdk.io/core/store"
	"cosmossdk.io/math"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	
	"github.com/PersonaPass-ID/personachain/x/token/types"
)

type Keeper struct {
	cdc codec.BinaryCodec
	storeService store.KVStoreService
	
	bankKeeper    types.BankKeeper
	stakingKeeper types.StakingKeeper
}

func NewKeeper(
	cdc codec.BinaryCodec,
	storeService store.KVStoreService,
	bankKeeper types.BankKeeper,
	stakingKeeper types.StakingKeeper,
) *Keeper {
	return &Keeper{
		cdc:           cdc,
		storeService:  storeService,
		bankKeeper:    bankKeeper,
		stakingKeeper: stakingKeeper,
	}
}

// GetPersonaToken returns the PERSONA token configuration
func (k Keeper) GetPersonaToken(ctx context.Context) (types.PersonaToken, error) {
	store := k.storeService.OpenKVStore(ctx)
	
	bz, err := store.Get(types.TokenConfigKey)
	if err != nil {
		return types.PersonaToken{}, err
	}
	
	if bz == nil {
		// Return default if not set
		return types.DefaultPersonaToken(), nil
	}
	
	var token types.PersonaToken
	if err := k.cdc.Unmarshal(bz, &token); err != nil {
		return types.PersonaToken{}, err
	}
	
	return token, nil
}

// SetPersonaToken sets the PERSONA token configuration
func (k Keeper) SetPersonaToken(ctx context.Context, token types.PersonaToken) error {
	if err := token.Validate(); err != nil {
		return err
	}
	
	store := k.storeService.OpenKVStore(ctx)
	bz, err := k.cdc.Marshal(&token)
	if err != nil {
		return err
	}
	
	return store.Set(types.TokenConfigKey, bz)
}

// GetParams returns the token parameters
func (k Keeper) GetParams(ctx context.Context) (types.TokenParams, error) {
	store := k.storeService.OpenKVStore(ctx)
	
	bz, err := store.Get(types.ParamsKey)
	if err != nil {
		return types.TokenParams{}, err
	}
	
	if bz == nil {
		return types.DefaultParams(), nil
	}
	
	var params types.TokenParams
	if err := k.cdc.Unmarshal(bz, &params); err != nil {
		return types.TokenParams{}, err
	}
	
	return params, nil
}

// SetParams sets the token parameters
func (k Keeper) SetParams(ctx context.Context, params types.TokenParams) error {
	if err := params.Validate(); err != nil {
		return err
	}
	
	store := k.storeService.OpenKVStore(ctx)
	bz, err := k.cdc.Marshal(&params)
	if err != nil {
		return err
	}
	
	return store.Set(types.ParamsKey, bz)
}

// MintTokens mints new PERSONA tokens (governance only)
func (k Keeper) MintTokens(ctx context.Context, amount math.Int) error {
	if amount.IsNegative() || amount.IsZero() {
		return types.ErrInvalidToken
	}
	
	token, err := k.GetPersonaToken(ctx)
	if err != nil {
		return err
	}
	
	// Check max supply
	newSupply := token.TotalSupply.Add(amount)
	if newSupply.GT(token.MaxSupply) {
		return types.ErrExceedsMaxSupply
	}
	
	// Mint coins
	coins := sdk.NewCoins(sdk.NewCoin(types.PersonaDenom, amount))
	if err := k.bankKeeper.MintCoins(ctx, types.ModuleName, coins); err != nil {
		return err
	}
	
	// Update total supply
	token.TotalSupply = newSupply
	return k.SetPersonaToken(ctx, token)
}

// GetTotalSupply returns the current total supply
func (k Keeper) GetTotalSupply(ctx context.Context) (math.Int, error) {
	token, err := k.GetPersonaToken(ctx)
	if err != nil {
		return math.ZeroInt(), err
	}
	return token.TotalSupply, nil
}

// GetMaxSupply returns the maximum supply
func (k Keeper) GetMaxSupply(ctx context.Context) (math.Int, error) {
	token, err := k.GetPersonaToken(ctx)
	if err != nil {
		return math.ZeroInt(), err
	}
	return token.MaxSupply, nil
}