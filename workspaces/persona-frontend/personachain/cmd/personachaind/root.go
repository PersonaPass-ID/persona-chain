package main

import (
	"errors"
	"io"
	"os"

	"cosmossdk.io/log"
	confixcmd "cosmossdk.io/tools/confix/cmd"
	dbm "github.com/cosmos/cosmos-db"

	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/client/config"
	"github.com/cosmos/cosmos-sdk/client/debug"
	"github.com/cosmos/cosmos-sdk/client/flags"
	"github.com/cosmos/cosmos-sdk/client/keys"
	"github.com/cosmos/cosmos-sdk/client/pruning"
	"github.com/cosmos/cosmos-sdk/client/rpc"
	"github.com/cosmos/cosmos-sdk/client/snapshot"
	"github.com/cosmos/cosmos-sdk/codec"
	codectypes "github.com/cosmos/cosmos-sdk/codec/types"
	"github.com/cosmos/cosmos-sdk/server"
	serverconfig "github.com/cosmos/cosmos-sdk/server/config"
	servertypes "github.com/cosmos/cosmos-sdk/server/types"
	"github.com/cosmos/cosmos-sdk/types/module"
	authcmd "github.com/cosmos/cosmos-sdk/x/auth/client/cli"
	"github.com/cosmos/cosmos-sdk/x/auth/tx"
	txmodule "github.com/cosmos/cosmos-sdk/x/auth/tx/config"
	"github.com/cosmos/cosmos-sdk/x/auth/types"
	bankcmd "github.com/cosmos/cosmos-sdk/x/bank/client/cli"
	"github.com/cosmos/cosmos-sdk/x/crisis"
	genutilcli "github.com/cosmos/cosmos-sdk/x/genutil/client/cli"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"github.com/spf13/pflag"
	tmcfg "github.com/cometbft/cometbft/config"

	"github.com/personahq/personachain/app"
)

// NewRootCmd creates a new root command for personachaind
func NewRootCmd() *cobra.Command {
	var (
		interfaceRegistry codectypes.InterfaceRegistry
		appCodec          codec.Codec
		txConfig          client.TxConfig
		legacyAmino       *codec.LegacyAmino
	)

	encodingConfig := app.MakeEncodingConfig()
	interfaceRegistry = encodingConfig.InterfaceRegistry
	appCodec = encodingConfig.Codec
	txConfig = encodingConfig.TxConfig
	legacyAmino = encodingConfig.Amino

	rootCmd := &cobra.Command{
		Use:   "personachaind",
		Short: "PersonaChain App",
		Long:  "PersonaChain blockchain node with DID, Credentials, and Zero-Knowledge Proofs",
		PersistentPreRunE: func(cmd *cobra.Command, _ []string) error {
			// set the default command outputs
			cmd.SetOut(cmd.OutOrStdout())
			cmd.SetErr(cmd.ErrOrStderr())

			initClientCtx := client.Context{}.
				WithCodec(appCodec).
				WithInterfaceRegistry(interfaceRegistry).
				WithLegacyAmino(legacyAmino).
				WithInput(os.Stdin).
				WithAccountRetriever(types.AccountRetriever{}).
				WithHomeDir(app.DefaultNodeHome).
				WithViper("")

			initClientCtx, err := client.ReadPersistentCommandFlags(initClientCtx, cmd.Flags())
			if err != nil {
				return err
			}

			initClientCtx, err = config.ReadFromClientConfig(initClientCtx)
			if err != nil {
				return err
			}

			// This needs to go after ReadFromClientConfig, as that function
			// sets the RPC client needed for SIGN_MODE_TEXTUAL.
			txConfigWithTextual, err := tx.NewTxConfigWithOptions(
				appCodec,
				tx.ConfigOptions{
					TextualCoinMetadataQueryFn: txmodule.NewGRPCCoinMetadataQueryFn(initClientCtx),
				},
			)
			if err != nil {
				return err
			}

			initClientCtx = initClientCtx.WithTxConfig(txConfigWithTextual)

			if err := client.SetCmdClientContextHandler(initClientCtx, cmd); err != nil {
				return err
			}

			customAppTemplate, customAppConfig := initAppConfig()
			customCMTConfig := initCometBFTConfig()

			return server.InterceptConfigsPreRunHandler(cmd, customAppTemplate, customAppConfig, customCMTConfig)
		},
	}

	initRootCmd(rootCmd, encodingConfig.TxConfig, encodingConfig.InterfaceRegistry, encodingConfig.Codec, app.ModuleBasics)

	overwriteFlagDefaults(rootCmd, map[string]string{
		flags.FlagChainID:        "personachain-1",
		flags.FlagKeyringBackend: "test",
	})

	return rootCmd
}

// initAppConfig helps to override default appConfig template and configs.
func initAppConfig() (string, interface{}) {
	customAppTemplate, customAppConfig := serverconfig.AppConfig("")

	return customAppTemplate, customAppConfig
}

func initCometBFTConfig() *tmcfg.Config {
	cfg := tmcfg.DefaultConfig()

	// these values put a higher strain on node memory
	cfg.P2P.MaxNumInboundPeers = 100
	cfg.P2P.MaxNumOutboundPeers = 40

	return cfg
}

func initRootCmd(
	rootCmd *cobra.Command,
	txConfig client.TxConfig,
	interfaceRegistry codectypes.InterfaceRegistry,
	appCodec codec.Codec,
	basicManager module.BasicManager,
) {
	rootCmd.AddCommand(
		genutilcli.InitCmd(basicManager, app.DefaultNodeHome),
		debug.Cmd(),
		confixcmd.ConfigCommand(),
		pruning.Cmd(newApp, app.DefaultNodeHome),
		snapshot.Cmd(newApp),
	)

	server.AddCommands(rootCmd, app.DefaultNodeHome, newApp, appExport, addModuleInitFlags)

	// add keyring to root command
	rootCmd.AddCommand(
		keys.Commands(app.DefaultNodeHome),
		rpc.StatusCommand(),
		genutilcli.ValidateGenesisCmd(basicManager),
		genutilcli.GenTxCmd(basicManager, txConfig, bankcmd.NewSendTxCmd(), app.DefaultNodeHome),
		genutilcli.CollectGenTxsCmd(bankcmd.GenesisBalancesIterator{}, app.DefaultNodeHome),
		genutilcli.MigrateGenesisCmd(),
		genutilcli.AddGenesisAccountCmd(app.DefaultNodeHome),
	)

	// Add tx commands
	if basicManager != nil {
		rootCmd.AddCommand(authcmd.TxCommand())
	}

	// Add query commands  
	if basicManager != nil {
		rootCmd.AddCommand(authcmd.QueryCommand())
	}
}

func addModuleInitFlags(startCmd *cobra.Command) {
	crisis.AddModuleInitFlags(startCmd)
}

// overwriteFlagDefaults is used to return the custom configs for the init command.
func overwriteFlagDefaults(c *cobra.Command, defaults map[string]string) {
	set := func(s *pflag.FlagSet, key, val string) {
		if f := s.Lookup(key); f != nil {
			f.DefValue = val
			f.Value.Set(val)
		}
	}
	for key, val := range defaults {
		set(c.Flags(), key, val)
		set(c.PersistentFlags(), key, val)
	}
	for _, c := range c.Commands() {
		overwriteFlagDefaults(c, defaults)
	}
}

// newApp creates the application
func newApp(
	logger log.Logger,
	db dbm.DB,
	traceStore io.Writer,
	appOpts servertypes.AppOptions,
) servertypes.Application {
	baseappOptions := server.DefaultBaseappOptions(appOpts)

	return app.NewPersonaChainApp(
		logger, db, traceStore, true, appOpts, baseappOptions...,
	)
}

// appExport creates a new simapp (optionally at a given height) and exports state.
func appExport(
	logger log.Logger,
	db dbm.DB,
	traceStore io.Writer,
	height int64,
	forZeroHeight bool,
	jailAllowedAddrs []string,
	appOpts servertypes.AppOptions,
	modulesToExport []string,
) (servertypes.ExportedApp, error) {
	var personaApp *app.PersonaChainApp

	// this check is necessary as we use the flag in x/upgrade.
	homePath, ok := appOpts.Get(flags.FlagHome).(string)
	if !ok || homePath == "" {
		return servertypes.ExportedApp{}, errors.New("application home not set")
	}

	viperAppOpts, ok := appOpts.(*viper.Viper)
	if !ok {
		return servertypes.ExportedApp{}, errors.New("appOpts is not viper.Viper")
	}

	// overwrite the FlagInvCheckPeriod
	viperAppOpts.Set(server.FlagInvCheckPeriod, 1)
	appOpts = viperAppOpts

	if height != -1 {
		personaApp = app.NewPersonaChainApp(logger, db, traceStore, false, appOpts)

		if err := personaApp.LoadHeight(height); err != nil {
			return servertypes.ExportedApp{}, err
		}
	} else {
		personaApp = app.NewPersonaChainApp(logger, db, traceStore, true, appOpts)
	}

	return personaApp.ExportAppStateAndValidators(forZeroHeight, jailAllowedAddrs, modulesToExport)
}