// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title PersonaPassIdentity
 * @dev Main identity contract for PersonaPass platform
 * @notice Manages decentralized identities and credentials with privacy preservation
 */
contract PersonaPassIdentity is 
    Initializable, 
    OwnableUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable 
{
    // Events
    event IdentityCreated(address indexed owner, bytes32 indexed did);
    event CredentialIssued(bytes32 indexed did, bytes32 indexed credentialType, uint256 timestamp);
    event CredentialRevoked(bytes32 indexed did, bytes32 indexed credentialId);
    event VerificationPerformed(address indexed verifier, bytes32 indexed did, bool result);

    // Structs
    struct Identity {
        bytes32 did;                    // Decentralized identifier
        address owner;                  // Wallet address
        uint256 createdAt;             // Creation timestamp
        uint256 nonce;                 // For replay protection
        mapping(bytes32 => Credential) credentials;  // Credential storage
        bytes32[] credentialIds;       // Credential ID list
    }

    struct Credential {
        bytes32 credentialType;        // Type of credential (e.g., "age_verification")
        bytes32 issuer;                // Issuer DID
        uint256 issuedAt;              // Issue timestamp
        uint256 expiresAt;             // Expiration timestamp
        bool revoked;                  // Revocation status
        bytes32 dataHash;              // Hash of credential data (stored off-chain)
    }

    // State variables
    mapping(address => bytes32) public addressToDID;
    mapping(bytes32 => Identity) public identities;
    mapping(bytes32 => bool) public registeredIssuers;
    mapping(address => uint256) public verificationCount;
    
    uint256 public constant VERIFICATION_FEE = 0.001 ether;
    uint256 public totalIdentities;
    uint256 public totalVerifications;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract
     */
    function initialize() public initializer {
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
    }

    /**
     * @dev Create a new identity
     * @param _did Decentralized identifier
     */
    function createIdentity(bytes32 _did) external whenNotPaused {
        require(addressToDID[msg.sender] == bytes32(0), "Identity already exists");
        require(_did != bytes32(0), "Invalid DID");

        Identity storage newIdentity = identities[_did];
        newIdentity.did = _did;
        newIdentity.owner = msg.sender;
        newIdentity.createdAt = block.timestamp;
        newIdentity.nonce = 0;

        addressToDID[msg.sender] = _did;
        totalIdentities++;

        emit IdentityCreated(msg.sender, _did);
    }

    /**
     * @dev Issue a credential to an identity
     * @param _did Target DID
     * @param _credentialType Type of credential
     * @param _dataHash Hash of credential data
     * @param _expiresAt Expiration timestamp
     */
    function issueCredential(
        bytes32 _did,
        bytes32 _credentialType,
        bytes32 _dataHash,
        uint256 _expiresAt
    ) external whenNotPaused {
        require(registeredIssuers[addressToDID[msg.sender]], "Not authorized issuer");
        require(identities[_did].owner != address(0), "Identity does not exist");
        require(_expiresAt > block.timestamp, "Invalid expiration");

        bytes32 credentialId = keccak256(abi.encodePacked(_did, _credentialType, block.timestamp));
        
        Identity storage identity = identities[_did];
        identity.credentials[credentialId] = Credential({
            credentialType: _credentialType,
            issuer: addressToDID[msg.sender],
            issuedAt: block.timestamp,
            expiresAt: _expiresAt,
            revoked: false,
            dataHash: _dataHash
        });
        identity.credentialIds.push(credentialId);

        emit CredentialIssued(_did, _credentialType, block.timestamp);
    }

    /**
     * @dev Verify a credential with zero-knowledge proof
     * @param _did DID to verify
     * @param _credentialType Type of credential to verify
     * @param _proof Zero-knowledge proof data
     */
    function verifyCredential(
        bytes32 _did,
        bytes32 _credentialType,
        bytes calldata _proof
    ) external payable whenNotPaused nonReentrant returns (bool) {
        require(msg.value >= VERIFICATION_FEE, "Insufficient fee");
        require(identities[_did].owner != address(0), "Identity does not exist");

        // Find credential
        Identity storage identity = identities[_did];
        bool found = false;
        bool valid = false;

        for (uint i = 0; i < identity.credentialIds.length; i++) {
            Credential storage cred = identity.credentials[identity.credentialIds[i]];
            if (cred.credentialType == _credentialType && !cred.revoked) {
                found = true;
                if (cred.expiresAt > block.timestamp) {
                    // Verify ZK proof (simplified - integrate with ZKVerifier contract)
                    valid = _verifyZKProof(_did, _credentialType, _proof);
                }
                break;
            }
        }

        require(found, "Credential not found");
        
        verificationCount[msg.sender]++;
        totalVerifications++;

        emit VerificationPerformed(msg.sender, _did, valid);
        
        return valid;
    }

    /**
     * @dev Revoke a credential
     * @param _did Target DID
     * @param _credentialId Credential ID to revoke
     */
    function revokeCredential(bytes32 _did, bytes32 _credentialId) external whenNotPaused {
        Identity storage identity = identities[_did];
        require(identity.owner == msg.sender || owner() == msg.sender, "Not authorized");
        require(identity.credentials[_credentialId].issuer != bytes32(0), "Credential not found");

        identity.credentials[_credentialId].revoked = true;
        
        emit CredentialRevoked(_did, _credentialId);
    }

    /**
     * @dev Register an issuer
     * @param _issuer Address of issuer
     */
    function registerIssuer(address _issuer) external onlyOwner {
        require(addressToDID[_issuer] != bytes32(0), "Issuer must have identity");
        registeredIssuers[addressToDID[_issuer]] = true;
    }

    /**
     * @dev Get credential count for an identity
     * @param _did DID to query
     */
    function getCredentialCount(bytes32 _did) external view returns (uint256) {
        return identities[_did].credentialIds.length;
    }

    /**
     * @dev Get credential by index
     * @param _did DID to query
     * @param _index Credential index
     */
    function getCredentialByIndex(bytes32 _did, uint256 _index) 
        external 
        view 
        returns (
            bytes32 credentialId,
            bytes32 credentialType,
            bytes32 issuer,
            uint256 issuedAt,
            uint256 expiresAt,
            bool revoked
        ) 
    {
        require(_index < identities[_did].credentialIds.length, "Index out of bounds");
        
        bytes32 credId = identities[_did].credentialIds[_index];
        Credential storage cred = identities[_did].credentials[credId];
        
        return (
            credId,
            cred.credentialType,
            cred.issuer,
            cred.issuedAt,
            cred.expiresAt,
            cred.revoked
        );
    }

    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Verify zero-knowledge proof (placeholder - integrate with ZKVerifier)
     */
    function _verifyZKProof(
        bytes32 _did,
        bytes32 _credentialType,
        bytes calldata _proof
    ) private pure returns (bool) {
        // TODO: Integrate with ZKVerifier contract
        // For now, return true if proof is not empty
        return _proof.length > 0;
    }

    /**
     * @dev Authorize upgrade (only owner)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}