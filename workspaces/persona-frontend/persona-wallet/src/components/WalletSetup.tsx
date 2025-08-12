import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Icon,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import { FaWallet, FaDownload, FaKey, FaUsb } from 'react-icons/fa';
import { hardwareWalletService, HardwareWalletInfo } from '../services/HardwareWalletService';

interface WalletSetupProps {
  onCreateWallet: () => Promise<void>;
  onImportWallet: (mnemonic: string) => Promise<void>;
  onConnectHardwareWallet: (deviceId: string, address: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const WalletSetup: React.FC<WalletSetupProps> = ({
  onCreateWallet,
  onImportWallet,
  onConnectHardwareWallet,
  loading,
  error,
}) => {
  const [importMnemonic, setImportMnemonic] = useState('');
  const [hardwareDevices, setHardwareDevices] = useState<HardwareWalletInfo[]>([]);
  const [hwLoading, setHwLoading] = useState(false);
  const [hwError, setHwError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isHwOpen, 
    onOpen: onHwOpen, 
    onClose: onHwClose 
  } = useDisclosure();

  const handleImport = async () => {
    if (!importMnemonic.trim()) return;
    
    try {
      await onImportWallet(importMnemonic.trim());
      onClose();
      setImportMnemonic('');
    } catch (error) {
      // Error is handled by parent component
    }
  };

  const detectHardwareWallets = async () => {
    setHwLoading(true);
    setHwError(null);
    
    try {
      const devices = await hardwareWalletService.detectHardwareWallets();
      setHardwareDevices(devices);
      
      if (devices.length === 0) {
        setHwError('No hardware wallets detected. Make sure your device is connected and unlocked.');
      }
    } catch (error) {
      setHwError(`Failed to detect hardware wallets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setHwLoading(false);
    }
  };

  const connectHardwareDevice = async (deviceType: 'ledger' | 'trezor') => {
    setHwLoading(true);
    setHwError(null);

    try {
      let deviceInfo: HardwareWalletInfo;
      
      if (deviceType === 'ledger') {
        deviceInfo = await hardwareWalletService.connectLedger();
      } else {
        deviceInfo = await hardwareWalletService.connectTrezor();
      }

      // Get the first address from the hardware wallet
      const addressInfo = await hardwareWalletService.getAddress(deviceInfo.id);
      
      // Connect the hardware wallet to the app
      await onConnectHardwareWallet(deviceInfo.id, addressInfo.address);
      
      onHwClose();
    } catch (error) {
      setHwError(`Failed to connect ${deviceType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setHwLoading(false);
    }
  };

  useEffect(() => {
    if (isHwOpen) {
      detectHardwareWallets();
    }
  }, [isHwOpen]);

  return (
    <Box maxW="md" mx="auto" mt={8} p={8} bg="white" rounded="2xl" shadow="xl">
      <VStack spacing={6}>
        <Box textAlign="center">
          <Icon as={FaWallet} boxSize={12} color="blue.500" mb={4} />
          <Text fontSize="3xl" fontWeight="bold" color="gray.800">
            PersonaWallet
          </Text>
          <Text fontSize="lg" color="gray.600">
            Your gateway to digital sovereignty
          </Text>
        </Box>

        <Divider />

        {error && (
          <Alert status="error" rounded="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <VStack spacing={4} w="full">
          <Button
            leftIcon={<FaWallet />}
            colorScheme="blue"
            size="lg"
            w="full"
            onClick={onCreateWallet}
            isLoading={loading}
            loadingText="Creating Wallet..."
          >
            Create New Wallet
          </Button>

          <Button
            leftIcon={<FaDownload />}
            variant="outline"
            colorScheme="blue"
            size="lg"
            w="full"
            onClick={onOpen}
            isDisabled={loading}
          >
            Import Existing Wallet
          </Button>

          <Button
            leftIcon={<FaUsb />}
            variant="outline"
            colorScheme="green"
            size="lg"
            w="full"
            onClick={onHwOpen}
            isDisabled={loading}
          >
            Connect Hardware Wallet
          </Button>
        </VStack>

        <Box textAlign="center" fontSize="sm" color="gray.500">
          <Text>Connected to PersonaChain</Text>
          <Text fontFamily="mono">personachain-1</Text>
        </Box>
      </VStack>

      {/* Import Wallet Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={FaKey} />
              <Text>Import Wallet</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Box w="full">
                <Text mb={2} fontWeight="medium">
                  Enter your 12 or 24-word recovery phrase:
                </Text>
                <Textarea
                  placeholder="word1 word2 word3 ... word24"
                  value={importMnemonic}
                  onChange={(e) => setImportMnemonic(e.target.value)}
                  rows={4}
                  resize="none"
                />
              </Box>

              <Alert status="warning" rounded="md" fontSize="sm">
                <AlertIcon />
                Make sure you're in a secure environment. Never share your recovery phrase with anyone.
              </Alert>

              <HStack w="full" spacing={3}>
                <Button
                  variant="outline"
                  onClick={onClose}
                  flex={1}
                  isDisabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleImport}
                  flex={1}
                  isLoading={loading}
                  loadingText="Importing..."
                  isDisabled={!importMnemonic.trim()}
                >
                  Import Wallet
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Hardware Wallet Modal */}
      <Modal isOpen={isHwOpen} onClose={onHwClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={FaUsb} />
              <Text>Connect Hardware Wallet</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              {hwError && (
                <Alert status="error" rounded="md">
                  <AlertIcon />
                  {hwError}
                </Alert>
              )}

              <Alert status="info" rounded="md" fontSize="sm">
                <AlertIcon />
                Make sure your hardware wallet is connected and unlocked. For Ledger devices, 
                open the Cosmos app.
              </Alert>

              {hwLoading ? (
                <VStack spacing={4} py={8}>
                  <Spinner size="lg" color="blue.500" />
                  <Text>Detecting hardware wallets...</Text>
                </VStack>
              ) : (
                <VStack spacing={3} w="full">
                  <Text fontWeight="medium">Choose your hardware wallet:</Text>
                  
                  <Button
                    leftIcon={<Icon as={FaUsb} />}
                    variant="outline"
                    size="lg"
                    w="full"
                    onClick={() => connectHardwareDevice('ledger')}
                    rightIcon={<Badge colorScheme="blue" fontSize="xs">Ledger</Badge>}
                  >
                    Connect Ledger Device
                  </Button>

                  <Button
                    leftIcon={<Icon as={FaUsb} />}
                    variant="outline"
                    size="lg"
                    w="full"
                    onClick={() => connectHardwareDevice('trezor')}
                    rightIcon={<Badge colorScheme="green" fontSize="xs">Trezor</Badge>}
                  >
                    Connect Trezor Device
                  </Button>

                  {hardwareDevices.length > 0 && (
                    <Box w="full" mt={4}>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>
                        Detected Devices:
                      </Text>
                      {hardwareDevices.map((device) => (
                        <HStack key={device.id} p={2} bg="gray.50" rounded="md">
                          <Badge colorScheme={device.type === 'ledger' ? 'blue' : 'green'}>
                            {device.type.toUpperCase()}
                          </Badge>
                          <Text fontSize="sm">{device.model}</Text>
                          <Text fontSize="xs" color="gray.500">
                            v{device.version}
                          </Text>
                        </HStack>
                      ))}
                    </Box>
                  )}

                  <Button
                    variant="outline"
                    onClick={detectHardwareWallets}
                    isLoading={hwLoading}
                    loadingText="Detecting..."
                    size="sm"
                    w="full"
                  >
                    Refresh Detection
                  </Button>
                </VStack>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};