import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Input,
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
  Badge,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Spacer,
  useToast,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { 
  FaWallet, 
  FaPaperPlane, 
  FaSync, 
  FaSignOutAlt, 
  FaCopy,
  FaIdCard,
  FaLink,
  FaUsers
} from 'react-icons/fa';
import { Wallet, DIDDocument } from '../types/wallet';
import { MultisigManager } from './MultisigManager';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

interface WalletDashboardProps {
  wallet: Wallet;
  didDocument?: DIDDocument | null;
  loading: boolean;
  error: string | null;
  onSendTokens: (toAddress: string, amount: string) => Promise<string>;
  onRefreshBalance: () => Promise<void>;
  onCreateDID: () => Promise<DIDDocument>;
  onLogout: () => void;
  hdWallet?: DirectSecp256k1HdWallet | null; // Add HD wallet for multi-sig operations
}

export const WalletDashboard: React.FC<WalletDashboardProps> = ({
  wallet,
  didDocument,
  loading,
  error,
  onSendTokens,
  onRefreshBalance,
  onCreateDID,
  onLogout,
  hdWallet,
}) => {
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copied to clipboard`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleSend = async () => {
    if (!sendAddress.trim() || !sendAmount.trim()) return;

    setSending(true);
    try {
      const txHash = await onSendTokens(sendAddress.trim(), sendAmount.trim());
      toast({
        title: 'Transaction sent!',
        description: `TX: ${txHash}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
      setSendAddress('');
      setSendAmount('');
    } catch (error) {
      toast({
        title: 'Transaction failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
  };

  const handleCreateDID = async () => {
    try {
      await onCreateDID();
      toast({
        title: 'DID created successfully!',
        description: 'Your digital identity is now ready',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'DID creation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxW="4xl" mx="auto" mt={4} p={6}>
      <VStack spacing={6}>
        {/* Header */}
        <Flex w="full" align="center">
          <HStack>
            <Icon as={FaWallet} boxSize={8} color="blue.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="2xl" fontWeight="bold">PersonaWallet</Text>
              <Text fontSize="sm" color="gray.600">Connected to PersonaChain</Text>
            </VStack>
          </HStack>
          <Spacer />
          <Button leftIcon={<FaSignOutAlt />} variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </Flex>

        {error && (
          <Alert status="error" rounded="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs w="full" size="lg">
          <TabList>
            <Tab>
              <Icon as={FaWallet} mr={2} />
              Wallet
            </Tab>
            <Tab>
              <Icon as={FaUsers} mr={2} />
              Multi-Signature
            </Tab>
          </TabList>

          <TabPanels>
            {/* Wallet Tab */}
            <TabPanel>
              <VStack spacing={6}>
                {/* Balance Card */}
                <Card w="full" variant="outline">
                  <CardHeader>
                    <Flex align="center">
                      <Text fontSize="lg" fontWeight="semibold">Balance</Text>
                      <Spacer />
                      <Button
                        leftIcon={<FaSync />}
                        size="sm"
                        variant="outline"
                        onClick={onRefreshBalance}
                        isLoading={loading}
                      >
                        Refresh
                      </Button>
                    </Flex>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack align="start" spacing={3}>
                      <Text fontSize="3xl" fontWeight="bold" color="blue.500">
                        {wallet.balance} PERSONA
                      </Text>
                      <HStack w="full">
                        <Text fontSize="sm" color="gray.600" fontFamily="mono" flex={1} noOfLines={1}>
                          {wallet.address}
                        </Text>
                        <Button
                          size="xs"
                          leftIcon={<FaCopy />}
                          onClick={() => copyToClipboard(wallet.address, 'Address')}
                        >
                          Copy
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* DID Card */}
                <Card w="full" variant="outline">
                  <CardHeader>
                    <Flex align="center">
                      <HStack>
                        <Icon as={FaIdCard} />
                        <Text fontSize="lg" fontWeight="semibold">Digital Identity (DID)</Text>
                      </HStack>
                      <Spacer />
                      {!didDocument && !wallet.did && (
                        <Button
                          leftIcon={<FaIdCard />}
                          size="sm"
                          colorScheme="green"
                          onClick={handleCreateDID}
                          isLoading={loading}
                        >
                          Create DID
                        </Button>
                      )}
                    </Flex>
                  </CardHeader>
                  <CardBody pt={0}>
                    {wallet.did || didDocument ? (
                      <VStack align="start" spacing={3}>
                        <HStack>
                          <Badge colorScheme="green" px={2} py={1}>Active</Badge>
                          <Text fontSize="sm" color="gray.600">Digital Identity Ready</Text>
                        </HStack>
                        <HStack w="full">
                          <Text fontSize="sm" fontFamily="mono" flex={1} noOfLines={1}>
                            {wallet.did || didDocument?.id}
                          </Text>
                          <Button
                            size="xs"
                            leftIcon={<FaCopy />}
                            onClick={() => copyToClipboard(wallet.did || didDocument?.id || '', 'DID')}
                          >
                            Copy
                          </Button>
                        </HStack>
                      </VStack>
                    ) : (
                      <VStack align="start" spacing={3}>
                        <HStack>
                          <Badge colorScheme="orange" px={2} py={1}>Not Created</Badge>
                          <Text fontSize="sm" color="gray.600">Create your digital identity</Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.500">
                          A DID (Decentralized Identifier) gives you full control over your digital identity.
                        </Text>
                      </VStack>
                    )}
                  </CardBody>
                </Card>

                {/* Actions */}
                <HStack w="full" spacing={4}>
                  <Button
                    leftIcon={<FaPaperPlane />}
                    colorScheme="blue"
                    size="lg"
                    flex={1}
                    onClick={onOpen}
                    isDisabled={loading}
                  >
                    Send PERSONA
                  </Button>
                  <Button
                    leftIcon={<FaLink />}
                    variant="outline"
                    size="lg"
                    flex={1}
                    isDisabled={true}
                  >
                    WalletConnect (Coming Soon)
                  </Button>
                </HStack>

                {/* Chain Info */}
                <Card w="full" variant="outline" bg="gray.50">
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.700">Network Information</Text>
                      <HStack spacing={6}>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs" color="gray.500">Chain ID</Text>
                          <Text fontSize="sm" fontFamily="mono">personachain-1</Text>
                        </VStack>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs" color="gray.500">Currency</Text>
                          <Text fontSize="sm">PERSONA</Text>
                        </VStack>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs" color="gray.500">Decimals</Text>
                          <Text fontSize="sm">6</Text>
                        </VStack>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Multi-Signature Tab */}
            <TabPanel p={0}>
              <MultisigManager 
                wallet={hdWallet} 
                userAddress={wallet.address} 
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Send Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={FaPaperPlane} />
              <Text>Send PERSONA</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Box w="full">
                <Text mb={2} fontWeight="medium">Recipient Address:</Text>
                <Input
                  placeholder="persona1..."
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                />
              </Box>

              <Box w="full">
                <Text mb={2} fontWeight="medium">Amount:</Text>
                <Input
                  placeholder="0.00"
                  type="number"
                  step="0.000001"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Available: {wallet.balance} PERSONA
                </Text>
              </Box>

              <Alert status="info" rounded="md" fontSize="sm">
                <AlertIcon />
                Transaction fees will be deducted from your balance.
              </Alert>

              <HStack w="full" spacing={3}>
                <Button
                  variant="outline"
                  onClick={onClose}
                  flex={1}
                  isDisabled={sending}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleSend}
                  flex={1}
                  isLoading={sending}
                  loadingText="Sending..."
                  isDisabled={!sendAddress.trim() || !sendAmount.trim()}
                >
                  Send
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};