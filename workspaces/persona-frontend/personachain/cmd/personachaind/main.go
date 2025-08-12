package main

import (
	"fmt"
	"os"

	"cosmossdk.io/log"
	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/client/config"
	"github.com/cosmos/cosmos-sdk/client/debug"
	"github.com/cosmos/cosmos-sdk/client/flags"
	"github.com/cosmos/cosmos-sdk/client/keys"
	"github.com/cosmos/cosmos-sdk/server"
	serverconfig "github.com/cosmos/cosmos-sdk/server/config"
	servertypes "github.com/cosmos/cosmos-sdk/server/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/x/auth/types"
	genutilcli "github.com/cosmos/cosmos-sdk/x/genutil/client/cli"
	genutiltypes "github.com/cosmos/cosmos-sdk/x/genutil/types"
	banktypes "github.com/cosmos/cosmos-sdk/x/bank/types"
	authcodec "github.com/cosmos/cosmos-sdk/x/auth/codec"
	"github.com/spf13/cobra"
	tmcfg "github.com/cometbft/cometbft/config"
	svrcmd "github.com/cosmos/cosmos-sdk/server/cmd"
	dbm "github.com/cosmos/cosmos-db"
	"io"

	"github.com/PersonaPass-ID/personachain/app"
)

// SetupConfig sets up the SDK configuration with PersonaChain specific bech32 prefixes
func init() {
	// Configure SDK with PersonaChain bech32 prefixes early
	config := sdk.GetConfig()
	config.SetBech32PrefixForAccount(app.Bech32MainPrefix, app.Bech32MainPrefix+sdk.PrefixPublic)
	config.SetBech32PrefixForValidator(app.Bech32MainPrefix+sdk.PrefixValidator+sdk.PrefixOperator, app.Bech32MainPrefix+sdk.PrefixValidator+sdk.PrefixOperator+sdk.PrefixPublic)
	config.SetBech32PrefixForConsensusNode(app.Bech32MainPrefix+sdk.PrefixValidator+sdk.PrefixConsensus, app.Bech32MainPrefix+sdk.PrefixValidator+sdk.PrefixConsensus+sdk.PrefixPublic)
	config.Seal()
}

// NewRootCmd creates a new root command for personachaind
func NewRootCmd() *cobra.Command {
	encodingConfig := app.MakeEncodingConfig()

	initClientCtx := client.Context{}.
		WithCodec(encodingConfig.Codec).
		WithInterfaceRegistry(encodingConfig.InterfaceRegistry).
		WithLegacyAmino(encodingConfig.Amino).
		WithInput(os.Stdin).
		WithAccountRetriever(types.AccountRetriever{}).
		WithHomeDir(app.DefaultNodeHome).
		WithViper("")

	rootCmd := &cobra.Command{
		Use:   "personachaind",
		Short: "PersonaChain App",
		Long:  "PersonaChain blockchain node with DID, Credentials, and Zero-Knowledge Proofs",
		PersistentPreRunE: func(cmd *cobra.Command, _ []string) error {
			cmd.SetOut(cmd.OutOrStdout())
			cmd.SetErr(cmd.ErrOrStderr())

			initClientCtx, err := client.ReadPersistentCommandFlags(initClientCtx, cmd.Flags())
			if err != nil {
				return err
			}

			initClientCtx, err = config.ReadFromClientConfig(initClientCtx)
			if err != nil {
				return err
			}

			if err := client.SetCmdClientContextHandler(initClientCtx, cmd); err != nil {
				return err
			}

			customAppTemplate, customAppConfig := initAppConfig()
			customCMTConfig := initCometBFTConfig()

			return server.InterceptConfigsPreRunHandler(cmd, customAppTemplate, customAppConfig, customCMTConfig)
		},
	}

	initRootCmd(rootCmd)

	return rootCmd
}

func initRootCmd(rootCmd *cobra.Command) {
	// Add basic management commands
	rootCmd.AddCommand(
		genutilcli.InitCmd(app.ModuleBasics, app.DefaultNodeHome),
		debug.Cmd(),
		keys.Commands(),
	)

	// Add query command (tx commands causing nil pointer - will fix in next iteration)
	queryCmd := &cobra.Command{
		Use:     "query",
		Aliases: []string{"q"},
		Short:   "Querying subcommands",
		DisableFlagParsing: true,
		SuggestionsMinimumDistance: 2,
		RunE: client.ValidateCmd,
	}
	// Add basic query commands without triggering module basics
	rootCmd.AddCommand(queryCmd)

	// Add comprehensive genesis commands based on Context7 docs
	genesisCmd := &cobra.Command{
		Use:   "genesis",
		Short: "Application's genesis-related subcommands",
	}
	
	encodingConfig := app.MakeEncodingConfig()
	
	genesisCmd.AddCommand(
		genutilcli.InitCmd(app.ModuleBasics, app.DefaultNodeHome),
		genutilcli.CollectGenTxsCmd(banktypes.GenesisBalancesIterator{}, app.DefaultNodeHome, genutiltypes.DefaultMessageValidator, authcodec.NewBech32Codec("personavaloper")),
		genutilcli.GenTxCmd(app.ModuleBasics, encodingConfig.TxConfig, banktypes.GenesisBalancesIterator{}, app.DefaultNodeHome, authcodec.NewBech32Codec("persona")),
		genutilcli.ValidateGenesisCmd(app.ModuleBasics),
		genutilcli.AddGenesisAccountCmd(app.DefaultNodeHome, authcodec.NewBech32Codec("persona")),
		genutilcli.MigrateGenesisCmd(nil),
	)
	rootCmd.AddCommand(genesisCmd)

	// Add server commands (start, etc)
	server.AddCommands(rootCmd, app.DefaultNodeHome, newApp, appExport, addModuleInitFlags)

	// Add basic version command
	rootCmd.AddCommand(&cobra.Command{
		Use:   "version",
		Short: "Print version information",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println("PersonaChain v1.0.0")
			fmt.Println("Modules: DID, Credential, ZKProof")
		},
	})

	// Set default flags
	rootCmd.PersistentFlags().String(flags.FlagChainID, "personachain-1", "genesis file chain-id")
	rootCmd.PersistentFlags().String(flags.FlagKeyringBackend, "test", "keyring backend")
}

func initAppConfig() (string, interface{}) {
	customAppConfig := serverconfig.DefaultConfig()
	customAppConfig.MinGasPrices = "0upersona"
	return serverconfig.DefaultConfigTemplate, customAppConfig
}

func initCometBFTConfig() *tmcfg.Config {
	cfg := tmcfg.DefaultConfig()
	cfg.P2P.MaxNumInboundPeers = 100
	cfg.P2P.MaxNumOutboundPeers = 40
	return cfg
}

func addModuleInitFlags(startCmd *cobra.Command) {
	// Add any module-specific init flags here
}

func newApp(logger log.Logger, db dbm.DB, traceStore io.Writer, appOpts servertypes.AppOptions) servertypes.Application {
	baseappOptions := server.DefaultBaseappOptions(appOpts)
	return app.NewPersonaChainAppNew(logger, db, traceStore, true, appOpts, baseappOptions...)
}

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
	var personaApp *app.PersonaChainAppNew
	
	loadLatest := height == -1
	personaApp = app.NewPersonaChainAppNew(logger, db, traceStore, loadLatest, appOpts)

	if height != -1 {
		if err := personaApp.LoadHeight(height); err != nil {
			return servertypes.ExportedApp{}, err
		}
	}

	return personaApp.ExportAppStateAndValidators(forZeroHeight, jailAllowedAddrs, modulesToExport)
}

func main() {
	rootCmd := NewRootCmd()

	if err := svrcmd.Execute(rootCmd, "", app.DefaultNodeHome); err != nil {
		log.NewLogger(rootCmd.OutOrStderr()).Error("failure when running app", "err", err)
		os.Exit(1)
	}
}