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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Divider,
  IconButton,
  Spinner,
  Progress,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { 
  FaUsers, 
  FaPlus, 
  FaSignature, 
  FaBroadcastTower, 
  FaVoteYea, 
  FaTrash,
  FaCheck,
  FaTimes,
  FaClock,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { 
  multisigService, 
  MultisigAccount, 
  MultisigTransaction, 
  MultisigProposal 
} from '../services/MultisigService';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { PERSONAPASS_CONFIG } from '../config/personachain';
import { MultisigValidator } from '../utils/multisig-validator';

interface MultisigManagerProps {
  wallet?: DirectSecp256k1HdWallet | null;
  userAddress?: string;
}

export const MultisigManager: React.FC<MultisigManagerProps> = ({ wallet, userAddress }) => {
  const [multisigAccounts, setMultisigAccounts] = useState<MultisigAccount[]>([]);
  const [transactions, setTransactions] = useState<MultisigTransaction[]>([]);
  const [proposals, setProposals] = useState<MultisigProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isTxOpen, onOpen: onTxOpen, onClose: onTxClose } = useDisclosure();
  const { isOpen: isPropOpen, onOpen: onPropOpen, onClose: onPropClose } = useDisclosure();
  
  const toast = useToast();

  // Create multisig form state
  const [createForm, setCreateForm] = useState({
    threshold: 2,
    members: [{ address: '', pubkey: '', name: '' }, { address: '', pubkey: '', name: '' }]
  });

  // Transaction form state  
  const [txForm, setTxForm] = useState({
    multisigId: '',
    type: 'send' as 'send' | 'delegate' | 'vote',
    recipient: '',
    amount: '',
    denom: 'upersona',
    validatorAddress: '',
    proposalId: '',
    vote: 'yes' as 'yes' | 'no' | 'abstain' | 'no_with_veto',
    memo: ''
  });

  // Proposal form state
  const [propForm, setPropForm] = useState({
    multisigId: '',
    title: '',
    description: '',
    type: 'add_member' as 'add_member' | 'remove_member' | 'change_threshold',
    newMemberAddress: '',
    newMemberPubkey: '',
    newMemberName: '',
    removeMemberAddress: '',
    newThreshold: 2
  });

  useEffect(() => {
    initializeService();
    loadData();
    
    // Set up periodic cleanup
    const cleanup = setInterval(() => {
      multisigService.cleanup();
    }, 60000); // Every minute

    return () => clearInterval(cleanup);
  }, []);

  const initializeService = async () => {
    try {
      await multisigService.initialize();
    } catch (error) {
      console.error('Failed to initialize multisig service:', error);
      setError('Failed to connect to PersonaChain');
    }
  };

  const loadData = () => {
    setMultisigAccounts(multisigService.listMultisigAccounts());
    setTransactions(multisigService.getPendingTransactions());
    setProposals(multisigService.getProposals());
  };

  const handleCreateMultisig = async () => {
    if (!wallet || !userAddress) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Pre-validation using MultisigValidator
      const validMembers = createForm.members.filter(m => m.address && m.pubkey);
      const validation = MultisigValidator.validateMultisigCreation(createForm.threshold, validMembers);
      
      if (!validation.valid) {
        throw new Error(validation.errors.join('; '));
      }

      // Additional client-side validations
      for (const member of validMembers) {
        if (member.name && member.name.trim().length > 0) {
          if (!MultisigValidator.validateMemberName(member.name)) {
            throw new Error(`Invalid member name "${member.name}": contains invalid characters or exceeds length limit`);
          }
        }
      }

      // Create multisig account
      const account = await multisigService.createMultisigAccount(
        createForm.threshold,
        validMembers
      );

      toast({
        title: 'Multi-signature Account Created',
        description: `Address: ${account.address}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      loadData();
      onCreateClose();
      
      // Reset form
      setCreateForm({
        threshold: 2,
        members: [{ address: '', pubkey: '', name: '' }, { address: '', pubkey: '', name: '' }]
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create multisig account');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async () => {
    if (!txForm.multisigId) {
      setError('Please select a multi-signature account');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Pre-validate memo if provided
      if (txForm.memo && txForm.memo.trim().length > 0) {
        if (!MultisigValidator.validateMemo(txForm.memo)) {
          throw new Error('Invalid memo: contains potentially dangerous content or exceeds length limit');
        }
      }

      const params: any = {
        memo: txForm.memo
      };

      switch (txForm.type) {
        case 'send':
          if (!txForm.recipient || !txForm.amount) {
            throw new Error('Recipient and amount are required');
          }
          
          // Validate recipient address
          if (!MultisigValidator.validateBech32Address(txForm.recipient)) {
            throw new Error('Invalid recipient address format');
          }
          
          // Validate amount
          if (!MultisigValidator.validateAmount(txForm.amount, txForm.denom)) {
            throw new Error(`Invalid amount: ${txForm.amount} ${txForm.denom}`);
          }
          
          params.recipients = [{
            address: txForm.recipient,
            amount: [{ denom: txForm.denom, amount: txForm.amount }]
          }];
          break;

        case 'delegate':
          if (!txForm.validatorAddress || !txForm.amount) {
            throw new Error('Validator address and amount are required');
          }
          
          // Validate validator address
          if (!MultisigValidator.validateBech32Address(txForm.validatorAddress, 'personavaloper')) {
            throw new Error('Invalid validator address format');
          }
          
          // Validate amount
          if (!MultisigValidator.validateAmount(txForm.amount, txForm.denom)) {
            throw new Error(`Invalid amount: ${txForm.amount} ${txForm.denom}`);
          }
          
          params.validatorAddress = txForm.validatorAddress;
          params.recipients = [{
            address: txForm.validatorAddress,
            amount: [{ denom: txForm.denom, amount: txForm.amount }]
          }];
          break;

        case 'vote':
          if (!txForm.proposalId) {
            throw new Error('Proposal ID is required');
          }
          params.proposalId = txForm.proposalId;
          params.vote = txForm.vote;
          break;
      }

      const transaction = await multisigService.createMultisigTransaction(
        txForm.multisigId,
        txForm.type,
        params
      );

      toast({
        title: 'Transaction Created',
        description: `Transaction ID: ${transaction.id}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      loadData();
      onTxClose();

      // Reset form
      setTxForm({
        multisigId: '',
        type: 'send',
        recipient: '',
        amount: '',
        denom: 'upersona',
        validatorAddress: '',
        proposalId: '',
        vote: 'yes',
        memo: ''
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleSignTransaction = async (transactionId: string) => {
    if (!wallet) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    try {
      await multisigService.signMultisigTransaction(transactionId, wallet);
      
      toast({
        title: 'Transaction Signed',
        description: 'Your signature has been added to the transaction',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcastTransaction = async (transactionId: string) => {
    setLoading(true);
    try {
      const txHash = await multisigService.broadcastMultisigTransaction(transactionId);
      
      toast({
        title: 'Transaction Broadcast',
        description: `Transaction Hash: ${txHash}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to broadcast transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async () => {
    if (!propForm.multisigId || !userAddress) {
      setError('Please select a multi-signature account');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const proposalData: any = {
        title: propForm.title,
        description: propForm.description,
        type: propForm.type
      };

      switch (propForm.type) {
        case 'add_member':
          if (!propForm.newMemberAddress || !propForm.newMemberPubkey) {
            throw new Error('New member address and public key are required');
          }
          proposalData.newMember = {
            address: propForm.newMemberAddress,
            pubkey: propForm.newMemberPubkey,
            name: propForm.newMemberName
          };
          break;

        case 'remove_member':
          if (!propForm.removeMemberAddress) {
            throw new Error('Member address to remove is required');
          }
          proposalData.removeMember = propForm.removeMemberAddress;
          break;

        case 'change_threshold':
          proposalData.newThreshold = propForm.newThreshold;
          break;
      }

      const proposal = await multisigService.createMultisigProposal(
        propForm.multisigId,
        proposalData,
        userAddress
      );

      toast({
        title: 'Proposal Created',
        description: `Proposal ID: ${proposal.id}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      loadData();
      onPropClose();

      // Reset form
      setPropForm({
        multisigId: '',
        title: '',
        description: '',
        type: 'add_member',
        newMemberAddress: '',
        newMemberPubkey: '',
        newMemberName: '',
        removeMemberAddress: '',
        newThreshold: 2
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleVoteProposal = async (proposalId: string, vote: 'yes' | 'no' | 'abstain') => {
    if (!userAddress) {
      setError('User address not available');
      return;
    }

    setLoading(true);
    try {
      await multisigService.voteOnProposal(proposalId, userAddress, vote);
      
      toast({
        title: 'Vote Cast',
        description: `You voted ${vote} on the proposal`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to vote on proposal');
    } finally {
      setLoading(false);
    }
  };

  const addMember = () => {
    setCreateForm({
      ...createForm,
      members: [...createForm.members, { address: '', pubkey: '', name: '' }]
    });
  };

  const removeMember = (index: number) => {
    if (createForm.members.length > 2) {
      setCreateForm({
        ...createForm,
        members: createForm.members.filter((_, i) => i !== index)
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'ready': return 'green'; 
      case 'broadcast': return 'blue';
      case 'confirmed': return 'green';
      case 'failed': return 'red';
      case 'active': return 'blue';
      case 'passed': return 'green';
      case 'rejected': return 'red';
      case 'executed': return 'purple';
      default: return 'gray';
    }
  };

  const formatAmount = (amount: string, denom: string) => {
    const num = parseInt(amount);
    if (denom === 'upersona') {
      return `${(num / 1_000_000).toFixed(6)} PERSONA`;
    }
    return `${amount} ${denom}`;
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Flex align="center">
          <Heading size="lg" display="flex" alignItems="center">
            <FaUsers style={{ marginRight: '12px' }} />
            Multi-signature Manager
          </Heading>
          <Spacer />
          <HStack spacing={3}>
            <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={onCreateOpen}>
              Create Multisig
            </Button>
            <Button leftIcon={<FaPlus />} variant="outline" onClick={onTxOpen}>
              New Transaction
            </Button>
            <Button leftIcon={<FaVoteYea />} variant="outline" onClick={onPropOpen}>
              New Proposal
            </Button>
          </HStack>
        </Flex>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
            <IconButton
              aria-label="Close error"
              icon={<FaTimes />}
              size="sm"
              ml="auto"
              variant="ghost"
              onClick={() => setError(null)}
            />
          </Alert>
        )}

        <Tabs>
          <TabList>
            <Tab>Accounts ({multisigAccounts.length})</Tab>
            <Tab>Transactions ({transactions.length})</Tab>
            <Tab>Proposals ({proposals.length})</Tab>
          </TabList>

          <TabPanels>
            {/* Multi-signature Accounts */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                {multisigAccounts.length === 0 ? (
                  <Text textAlign="center" color="gray.500">
                    No multi-signature accounts found. Create one to get started.
                  </Text>
                ) : (
                  multisigAccounts.map((account) => (
                    <Card key={account.id}>
                      <CardHeader>
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" fontSize="sm" fontFamily="mono">
                              {account.address}
                            </Text>
                            <HStack>
                              <Badge colorScheme="blue">{account.threshold} of {account.pubkeys.length}</Badge>
                              <Text fontSize="sm" color="gray.500">
                                Created {account.createdAt.toLocaleDateString()}
                              </Text>
                            </HStack>
                          </VStack>
                        </HStack>
                      </CardHeader>
                      <CardBody pt={0}>
                        <VStack align="start" spacing={3}>
                          {account.balance && account.balance.length > 0 && (
                            <Box>
                              <Text fontWeight="medium" mb={1}>Balance:</Text>
                              {account.balance.map((bal) => (
                                <Text key={bal.denom} fontSize="sm">
                                  {formatAmount(bal.amount, bal.denom)}
                                </Text>
                              ))}
                            </Box>
                          )}
                          
                          <Box>
                            <Text fontWeight="medium" mb={2}>Members:</Text>
                            <VStack align="stretch" spacing={1}>
                              {account.pubkeys.map((member, idx) => (
                                <HStack key={idx} fontSize="sm">
                                  <Text>{member.name || `Member ${idx + 1}`}</Text>
                                  <Spacer />
                                  <Text fontFamily="mono" color="gray.600">
                                    {member.address.slice(0, 12)}...
                                  </Text>
                                </HStack>
                              ))}
                            </VStack>
                          </Box>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))
                )}
              </VStack>
            </TabPanel>

            {/* Pending Transactions */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                {transactions.length === 0 ? (
                  <Text textAlign="center" color="gray.500">
                    No pending transactions found.
                  </Text>
                ) : (
                  transactions.map((tx) => {
                    const signedCount = tx.signatures.filter(sig => sig.signed).length;
                    const multisigAccount = multisigAccounts.find(acc => acc.address === tx.multisigAddress);
                    const threshold = multisigAccount?.threshold || 1;
                    const userSig = tx.signatures.find(sig => sig.address === userAddress);
                    
                    return (
                      <Card key={tx.id}>
                        <CardHeader>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <HStack>
                                <Badge colorScheme={getStatusColor(tx.status)}>{tx.status.toUpperCase()}</Badge>
                                <Badge>{tx.type.toUpperCase()}</Badge>
                              </HStack>
                              <Text fontSize="sm" color="gray.500">
                                {tx.createdAt.toLocaleDateString()}
                              </Text>
                            </VStack>
                            <Text fontSize="sm" fontFamily="mono">
                              ID: {tx.id}
                            </Text>
                          </HStack>
                        </CardHeader>
                        <CardBody pt={0}>
                          <VStack align="stretch" spacing={3}>
                            <Progress 
                              value={(signedCount / threshold) * 100} 
                              colorScheme="green"
                              size="sm"
                            />
                            <Text fontSize="sm">
                              Signatures: {signedCount} of {threshold} required
                            </Text>
                            
                            {tx.recipients && (
                              <Box>
                                <Text fontWeight="medium" mb={1}>Recipients:</Text>
                                {tx.recipients.map((recipient, idx) => (
                                  <Text key={idx} fontSize="sm" fontFamily="mono">
                                    {recipient.address}: {recipient.amount.map(a => formatAmount(a.amount, a.denom)).join(', ')}
                                  </Text>
                                ))}
                              </Box>
                            )}

                            {tx.memo && (
                              <Box>
                                <Text fontWeight="medium" mb={1}>Memo:</Text>
                                <Text fontSize="sm">{tx.memo}</Text>
                              </Box>
                            )}

                            <HStack justify="space-between">
                              <HStack>
                                {userSig && !userSig.signed && tx.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    colorScheme="green"
                                    leftIcon={<FaSignature />}
                                    onClick={() => handleSignTransaction(tx.id)}
                                    isLoading={loading}
                                  >
                                    Sign
                                  </Button>
                                )}
                                
                                {tx.status === 'ready' && (
                                  <Button
                                    size="sm"
                                    colorScheme="blue"
                                    leftIcon={<FaBroadcastTower />}
                                    onClick={() => handleBroadcastTransaction(tx.id)}
                                    isLoading={loading}
                                  >
                                    Broadcast
                                  </Button>
                                )}

                                {tx.txHash && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<FaExternalLinkAlt />}
                                    onClick={() => window.open(`${PERSONAPASS_CONFIG.explorerUrl}/tx/${tx.txHash}`, '_blank')}
                                  >
                                    View on Explorer
                                  </Button>
                                )}
                              </HStack>
                              
                              <Text fontSize="xs" color="gray.500">
                                Expires: {tx.expiresAt?.toLocaleDateString()}
                              </Text>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    );
                  })
                )}
              </VStack>
            </TabPanel>

            {/* Proposals */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                {proposals.length === 0 ? (
                  <Text textAlign="center" color="gray.500">
                    No proposals found.
                  </Text>
                ) : (
                  proposals.map((proposal) => {
                    const multisigAccount = multisigAccounts.find(acc => acc.address === proposal.multisigAddress);
                    const threshold = multisigAccount?.threshold || 1;
                    const yesVotes = proposal.votes.filter(v => v.vote === 'yes').length;
                    const userVote = proposal.votes.find(v => v.address === userAddress);
                    
                    return (
                      <Card key={proposal.id}>
                        <CardHeader>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="bold">{proposal.title}</Text>
                              <HStack>
                                <Badge colorScheme={getStatusColor(proposal.status)}>{proposal.status.toUpperCase()}</Badge>
                                <Badge>{proposal.type.replace('_', ' ').toUpperCase()}</Badge>
                              </HStack>
                            </VStack>
                            <Text fontSize="sm" color="gray.500">
                              {proposal.createdAt.toLocaleDateString()}
                            </Text>
                          </HStack>
                        </CardHeader>
                        <CardBody pt={0}>
                          <VStack align="stretch" spacing={3}>
                            <Text fontSize="sm">{proposal.description}</Text>
                            
                            <Progress 
                              value={(yesVotes / threshold) * 100} 
                              colorScheme="green"
                              size="sm"
                            />
                            <Text fontSize="sm">
                              Votes: {yesVotes} of {threshold} required to pass
                            </Text>

                            {proposal.status === 'active' && !userVote && userAddress && (
                              <HStack>
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  onClick={() => handleVoteProposal(proposal.id, 'yes')}
                                  isLoading={loading}
                                >
                                  Vote Yes
                                </Button>
                                <Button
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => handleVoteProposal(proposal.id, 'no')}
                                  isLoading={loading}
                                >
                                  Vote No
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVoteProposal(proposal.id, 'abstain')}
                                  isLoading={loading}
                                >
                                  Abstain
                                </Button>
                              </HStack>
                            )}

                            {userVote && (
                              <Text fontSize="sm" color="blue.600">
                                You voted: {userVote.vote.toUpperCase()}
                              </Text>
                            )}

                            <Text fontSize="xs" color="gray.500">
                              Expires: {proposal.expiresAt.toLocaleDateString()}
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    );
                  })
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Create Multisig Modal */}
        <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create Multi-signature Account</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <Box w="full">
                  <Text mb={2} fontWeight="medium">Signature Threshold</Text>
                  <NumberInput
                    value={createForm.threshold}
                    onChange={(_, num) => setCreateForm({ ...createForm, threshold: num || 1 })}
                    min={1}
                    max={createForm.members.length}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="sm" color="gray.500">
                    {createForm.threshold} of {createForm.members.length} signatures required
                  </Text>
                </Box>

                <Box w="full">
                  <Text mb={2} fontWeight="medium">Members</Text>
                  {createForm.members.map((member, idx) => (
                    <VStack key={idx} spacing={2} p={3} bg="gray.50" rounded="md" mb={3}>
                      <HStack w="full">
                        <Text fontWeight="medium">Member {idx + 1}</Text>
                        <Spacer />
                        {createForm.members.length > 2 && (
                          <IconButton
                            aria-label="Remove member"
                            icon={<FaTrash />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => removeMember(idx)}
                          />
                        )}
                      </HStack>
                      <Input
                        placeholder="Name (optional)"
                        value={member.name}
                        onChange={(e) => {
                          const newMembers = [...createForm.members];
                          newMembers[idx].name = e.target.value;
                          setCreateForm({ ...createForm, members: newMembers });
                        }}
                      />
                      <Input
                        placeholder="Address (persona1...)"
                        value={member.address}
                        onChange={(e) => {
                          const newMembers = [...createForm.members];
                          newMembers[idx].address = e.target.value;
                          setCreateForm({ ...createForm, members: newMembers });
                        }}
                      />
                      <Input
                        placeholder="Public Key (base64)"
                        value={member.pubkey}
                        onChange={(e) => {
                          const newMembers = [...createForm.members];
                          newMembers[idx].pubkey = e.target.value;
                          setCreateForm({ ...createForm, members: newMembers });
                        }}
                      />
                    </VStack>
                  ))}
                  
                  <Button leftIcon={<FaPlus />} variant="outline" onClick={addMember} w="full">
                    Add Member
                  </Button>
                </Box>

                <HStack w="full" spacing={3}>
                  <Button variant="outline" onClick={onCreateClose} flex={1}>
                    Cancel
                  </Button>
                  <Button 
                    colorScheme="blue" 
                    onClick={handleCreateMultisig}
                    isLoading={loading}
                    flex={1}
                  >
                    Create Account
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Create Transaction Modal */}
        <Modal isOpen={isTxOpen} onClose={onTxClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create Transaction</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <Box w="full">
                  <Text mb={2} fontWeight="medium">Multi-signature Account</Text>
                  <Select 
                    placeholder="Select account"
                    value={txForm.multisigId}
                    onChange={(e) => setTxForm({ ...txForm, multisigId: e.target.value })}
                  >
                    {multisigAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.address} ({acc.threshold}/{acc.pubkeys.length})
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box w="full">
                  <Text mb={2} fontWeight="medium">Transaction Type</Text>
                  <Select 
                    value={txForm.type}
                    onChange={(e) => setTxForm({ ...txForm, type: e.target.value as any })}
                  >
                    <option value="send">Send Tokens</option>
                    <option value="delegate">Delegate to Validator</option>
                    <option value="vote">Vote on Proposal</option>
                  </Select>
                </Box>

                {txForm.type === 'send' && (
                  <>
                    <Input
                      placeholder="Recipient Address"
                      value={txForm.recipient}
                      onChange={(e) => setTxForm({ ...txForm, recipient: e.target.value })}
                    />
                    <HStack w="full">
                      <Input
                        placeholder="Amount"
                        value={txForm.amount}
                        onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                      />
                      <Select 
                        value={txForm.denom}
                        onChange={(e) => setTxForm({ ...txForm, denom: e.target.value })}
                        minW="120px"
                      >
                        <option value="upersona">PERSONA</option>
                      </Select>
                    </HStack>
                  </>
                )}

                {txForm.type === 'delegate' && (
                  <>
                    <Input
                      placeholder="Validator Address"
                      value={txForm.validatorAddress}
                      onChange={(e) => setTxForm({ ...txForm, validatorAddress: e.target.value })}
                    />
                    <Input
                      placeholder="Amount (in PERSONA)"
                      value={txForm.amount}
                      onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    />
                  </>
                )}

                {txForm.type === 'vote' && (
                  <>
                    <Input
                      placeholder="Proposal ID"
                      value={txForm.proposalId}
                      onChange={(e) => setTxForm({ ...txForm, proposalId: e.target.value })}
                    />
                    <Select 
                      value={txForm.vote}
                      onChange={(e) => setTxForm({ ...txForm, vote: e.target.value as any })}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="abstain">Abstain</option>
                      <option value="no_with_veto">No with Veto</option>
                    </Select>
                  </>
                )}

                <Textarea
                  placeholder="Memo (optional)"
                  value={txForm.memo}
                  onChange={(e) => setTxForm({ ...txForm, memo: e.target.value })}
                />

                <HStack w="full" spacing={3}>
                  <Button variant="outline" onClick={onTxClose} flex={1}>
                    Cancel
                  </Button>
                  <Button 
                    colorScheme="blue" 
                    onClick={handleCreateTransaction}
                    isLoading={loading}
                    flex={1}
                  >
                    Create Transaction
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Create Proposal Modal */}
        <Modal isOpen={isPropOpen} onClose={onPropClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create Proposal</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <Box w="full">
                  <Text mb={2} fontWeight="medium">Multi-signature Account</Text>
                  <Select 
                    placeholder="Select account"
                    value={propForm.multisigId}
                    onChange={(e) => setPropForm({ ...propForm, multisigId: e.target.value })}
                  >
                    {multisigAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.address}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Input
                  placeholder="Proposal Title"
                  value={propForm.title}
                  onChange={(e) => setPropForm({ ...propForm, title: e.target.value })}
                />

                <Textarea
                  placeholder="Proposal Description"
                  value={propForm.description}
                  onChange={(e) => setPropForm({ ...propForm, description: e.target.value })}
                />

                <Box w="full">
                  <Text mb={2} fontWeight="medium">Proposal Type</Text>
                  <Select 
                    value={propForm.type}
                    onChange={(e) => setPropForm({ ...propForm, type: e.target.value as any })}
                  >
                    <option value="add_member">Add Member</option>
                    <option value="remove_member">Remove Member</option>
                    <option value="change_threshold">Change Threshold</option>
                  </Select>
                </Box>

                {propForm.type === 'add_member' && (
                  <>
                    <Input
                      placeholder="New Member Name (optional)"
                      value={propForm.newMemberName}
                      onChange={(e) => setPropForm({ ...propForm, newMemberName: e.target.value })}
                    />
                    <Input
                      placeholder="New Member Address"
                      value={propForm.newMemberAddress}
                      onChange={(e) => setPropForm({ ...propForm, newMemberAddress: e.target.value })}
                    />
                    <Input
                      placeholder="New Member Public Key"
                      value={propForm.newMemberPubkey}
                      onChange={(e) => setPropForm({ ...propForm, newMemberPubkey: e.target.value })}
                    />
                  </>
                )}

                {propForm.type === 'remove_member' && (
                  <Select 
                    placeholder="Select member to remove"
                    value={propForm.removeMemberAddress}
                    onChange={(e) => setPropForm({ ...propForm, removeMemberAddress: e.target.value })}
                  >
                    {propForm.multisigId && multisigAccounts.find(acc => acc.id === propForm.multisigId)?.pubkeys.map(member => (
                      <option key={member.address} value={member.address}>
                        {member.name || member.address}
                      </option>
                    ))}
                  </Select>
                )}

                {propForm.type === 'change_threshold' && (
                  <NumberInput
                    value={propForm.newThreshold}
                    onChange={(_, num) => setPropForm({ ...propForm, newThreshold: num || 1 })}
                    min={1}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                )}

                <HStack w="full" spacing={3}>
                  <Button variant="outline" onClick={onPropClose} flex={1}>
                    Cancel
                  </Button>
                  <Button 
                    colorScheme="blue" 
                    onClick={handleCreateProposal}
                    isLoading={loading}
                    flex={1}
                  >
                    Create Proposal
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};