import React, { useEffect } from 'react';
import { ChakraProvider, Container, Box } from '@chakra-ui/react';
import { WalletSetup } from './components/WalletSetup';
import { WalletDashboard } from './components/WalletDashboard';
import { useWallet } from './hooks/useWallet';
import { personaChainService } from './services/PersonaChainService';

function App() {
  const {
    wallet,
    hdWallet,
    didDocument,
    loading,
    error,
    createWallet,
    importWallet,
    createDID,
    sendTokens,
    refreshBalance,
    logout,
  } = useWallet();

  // Initialize PersonaChain connection on app start
  useEffect(() => {
    personaChainService.connect().catch(console.error);
  }, []);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (wallet) {
      const interval = setInterval(() => {
        refreshBalance();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [wallet, refreshBalance]);

  const handleCreateWallet = async () => {
    await createWallet();
  };

  const handleImportWallet = async (mnemonic: string) => {
    await importWallet(mnemonic);
  };

  const handleConnectHardwareWallet = async (deviceId: string, address: string) => {
    // For now, create a hardware wallet entry
    // In the future, this should properly integrate with the wallet context
    console.log(`Connected hardware wallet - Device ID: ${deviceId}, Address: ${address}`);
    
    // Create a mock wallet entry for hardware wallet
    // This should be properly implemented in the useWallet hook
    await createWallet(); // Temporary - should create hardware wallet type
  };

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="gray.50">
        <Container maxW="container.xl" py={8}>
          {wallet ? (
            <WalletDashboard
              wallet={wallet}
              didDocument={didDocument}
              loading={loading}
              error={error}
              onSendTokens={sendTokens}
              onRefreshBalance={refreshBalance}
              onCreateDID={createDID}
              onLogout={logout}
              hdWallet={hdWallet}
            />
          ) : (
            <WalletSetup
              onCreateWallet={handleCreateWallet}
              onImportWallet={handleImportWallet}
              onConnectHardwareWallet={handleConnectHardwareWallet}
              loading={loading}
              error={error}
            />
          )}
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App;