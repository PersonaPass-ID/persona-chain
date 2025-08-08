package app

import (
	_ "embed"

	"cosmossdk.io/core/appconfig"
	sdk "github.com/cosmos/cosmos-sdk/types"

	authtypes "github.com/cosmos/cosmos-sdk/x/auth/types"
	stakingtypes "github.com/cosmos/cosmos-sdk/x/staking/types"
)

var (
	// module account permissions
	maccPerms = map[string][]string{
		authtypes.FeeCollectorName:     nil,
		stakingtypes.BondedPoolName:    {authtypes.Burner, authtypes.Staking},
		stakingtypes.NotBondedPoolName: {authtypes.Burner, authtypes.Staking},
	}

	// blocked module account addresses that users cannot send tokens to
	blockedModuleAccountAddresses = []string{
		authtypes.FeeCollectorName,
		stakingtypes.BondedPoolName,
		stakingtypes.NotBondedPoolName,
		// PersonaChain module accounts can receive tokens for operations
	}
)

//go:embed app.yaml
var AppConfigYAML []byte

var AppConfig = appconfig.LoadYAML(AppConfigYAML)

func init() {
	// Set PersonaChain address prefix
	config := sdk.GetConfig()
	config.SetBech32PrefixForAccount("persona", "persona"+"pub")
	config.SetBech32PrefixForValidator("persona"+"valoper", "persona"+"valoperpub")
	config.SetBech32PrefixForConsensusNode("persona"+"valcons", "persona"+"valconspub")
	config.Seal()
}