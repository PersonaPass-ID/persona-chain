// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./KYCVerifier.sol";
import "./PersonhoodVerifier.sol";

/**
 * @title PersonaPass Registry
 * @dev Multi-chain privacy-preserving identity registry
 * 
 * Features:
 * - Zero-knowledge KYC verification
 * - Proof of personhood validation
 * - Anti-sybil protection
 * - Cross-chain credential management
 * - Privacy-preserving verification
 */
contract PersonaPassRegistry {
    
    // Events
    event KYCVerified(address indexed user, uint256 tier, uint256 region, bytes32 commitment);
    event PersonhoodVerified(address indexed user, uint256 confidence, uint256 diversity, bytes32 commitment);
    event CredentialIssued(address indexed user, bytes32 credentialId, string credentialType);
    event CredentialRevoked(address indexed user, bytes32 credentialId, string reason);
    event SybilAttackDetected(address indexed attacker, bytes32 duplicateCommitment);
    
    // Structs
    struct KYCRecord {
        bool isVerified;
        uint256 tier;
        uint256 region;
        uint256 timestamp;
        uint256 expiration;
        bytes32 uniquenessCommitment;
        bytes32 validityProof;
    }
    
    struct PersonhoodRecord {
        bool isVerified;
        uint256 confidence;
        uint256 diversity;
        uint256 timestamp;
        uint256 expiration;
        bytes32 antiSybilCommitment;
        bytes32 temporalProof;
        bytes32 networkBinding;
    }
    
    struct Credential {
        bytes32 id;
        string credentialType;
        address issuer;
        address subject;
        uint256 issuanceDate;
        uint256 expirationDate;
        bool isRevoked;
        string data; // Encrypted credential data
    }
    
    // State variables
    KYCVerifier public immutable kycVerifier;
    PersonhoodVerifier public immutable personhoodVerifier;
    
    mapping(address => KYCRecord) public kycRecords;
    mapping(address => PersonhoodRecord) public personhoodRecords;
    mapping(bytes32 => Credential) public credentials;
    mapping(address => bytes32[]) public userCredentials;
    
    // Anti-sybil protection
    mapping(bytes32 => address) public uniquenessCommitments; // KYC uniqueness
    mapping(bytes32 => address) public antiSybilCommitments; // Personhood uniqueness
    
    // Access control
    mapping(address => bool) public authorizedIssuers;
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender] || msg.sender == owner, "Not authorized issuer");
        _;
    }
    
    constructor(
        address _kycVerifier,
        address _personhoodVerifier
    ) {
        kycVerifier = KYCVerifier(_kycVerifier);
        personhoodVerifier = PersonhoodVerifier(_personhoodVerifier);
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }
    
    /**
     * @dev Verify KYC with zero-knowledge proof
     */
    function verifyKYC(
        uint[2] memory _pA,
        uint[2][2] memory _pB,
        uint[2] memory _pC,
        uint[5] memory _publicSignals
    ) external {
        // Verify the ZK proof
        require(
            kycVerifier.verifyProof(_pA, _pB, _pC, _publicSignals),
            "Invalid KYC proof"
        );
        
        // Extract public signals
        bool isKYCValid = _publicSignals[0] == 1;
        uint256 verificationTier = _publicSignals[1];
        uint256 complianceRegion = _publicSignals[2];
        bytes32 validityProof = bytes32(_publicSignals[3]);
        bytes32 uniquenessCommitment = bytes32(_publicSignals[4]);
        
        require(isKYCValid, "KYC verification failed");
        
        // Check for sybil attack
        if (uniquenessCommitments[uniquenessCommitment] != address(0)) {
            emit SybilAttackDetected(msg.sender, uniquenessCommitment);
            revert("Sybil attack detected");
        }
        
        // Store KYC record
        kycRecords[msg.sender] = KYCRecord({
            isVerified: true,
            tier: verificationTier,
            region: complianceRegion,
            timestamp: block.timestamp,
            expiration: block.timestamp + 365 days,
            uniquenessCommitment: uniquenessCommitment,
            validityProof: validityProof
        });
        
        // Register uniqueness commitment
        uniquenessCommitments[uniquenessCommitment] = msg.sender;
        
        emit KYCVerified(msg.sender, verificationTier, complianceRegion, uniquenessCommitment);
    }
    
    /**
     * @dev Verify proof of personhood with zero-knowledge proof
     */
    function verifyPersonhood(
        uint[2] memory _pA,
        uint[2][2] memory _pB,
        uint[2] memory _pC,
        uint[5] memory _publicSignals
    ) external {
        // Verify the ZK proof
        require(
            personhoodVerifier.verifyProof(_pA, _pB, _pC, _publicSignals),
            "Invalid personhood proof"
        );
        
        // Extract public signals
        uint256 personhoodConfidence = _publicSignals[0];
        uint256 verificationDiversity = _publicSignals[1];
        bytes32 antiSybilCommitment = bytes32(_publicSignals[2]);
        bytes32 temporalProof = bytes32(_publicSignals[3]);
        bytes32 networkBinding = bytes32(_publicSignals[4]);
        
        require(personhoodConfidence >= 70, "Insufficient personhood confidence");
        
        // Check for sybil attack
        if (antiSybilCommitments[antiSybilCommitment] != address(0)) {
            emit SybilAttackDetected(msg.sender, antiSybilCommitment);
            revert("Sybil attack detected");
        }
        
        // Store personhood record
        personhoodRecords[msg.sender] = PersonhoodRecord({
            isVerified: true,
            confidence: personhoodConfidence,
            diversity: verificationDiversity,
            timestamp: block.timestamp,
            expiration: block.timestamp + 90 days,
            antiSybilCommitment: antiSybilCommitment,
            temporalProof: temporalProof,
            networkBinding: networkBinding
        });
        
        // Register anti-sybil commitment
        antiSybilCommitments[antiSybilCommitment] = msg.sender;
        
        emit PersonhoodVerified(msg.sender, personhoodConfidence, verificationDiversity, antiSybilCommitment);
    }
    
    /**
     * @dev Issue a verifiable credential
     */
    function issueCredential(
        address _subject,
        bytes32 _credentialId,
        string memory _credentialType,
        string memory _data,
        uint256 _expirationDate
    ) external onlyAuthorizedIssuer {
        require(_subject != address(0), "Invalid subject");
        require(_credentialId != bytes32(0), "Invalid credential ID");
        require(credentials[_credentialId].id == bytes32(0), "Credential already exists");
        
        credentials[_credentialId] = Credential({
            id: _credentialId,
            credentialType: _credentialType,
            issuer: msg.sender,
            subject: _subject,
            issuanceDate: block.timestamp,
            expirationDate: _expirationDate,
            isRevoked: false,
            data: _data
        });
        
        userCredentials[_subject].push(_credentialId);
        
        emit CredentialIssued(_subject, _credentialId, _credentialType);
    }
    
    /**
     * @dev Revoke a credential
     */
    function revokeCredential(
        bytes32 _credentialId,
        string memory _reason
    ) external {
        Credential storage credential = credentials[_credentialId];
        require(credential.id != bytes32(0), "Credential does not exist");
        require(
            msg.sender == credential.issuer || msg.sender == owner,
            "Not authorized to revoke"
        );
        require(!credential.isRevoked, "Credential already revoked");
        
        credential.isRevoked = true;
        
        emit CredentialRevoked(credential.subject, _credentialId, _reason);
    }
    
    /**
     * @dev Check if user has valid KYC
     */
    function hasValidKYC(address _user) external view returns (bool) {
        KYCRecord memory record = kycRecords[_user];
        return record.isVerified && block.timestamp < record.expiration;
    }
    
    /**
     * @dev Check if user has valid proof of personhood
     */
    function hasValidPersonhood(address _user) external view returns (bool) {
        PersonhoodRecord memory record = personhoodRecords[_user];
        return record.isVerified && block.timestamp < record.expiration;
    }
    
    /**
     * @dev Get user's KYC tier
     */
    function getKYCTier(address _user) external view returns (uint256) {
        require(this.hasValidKYC(_user), "No valid KYC");
        return kycRecords[_user].tier;
    }
    
    /**
     * @dev Get user's personhood confidence
     */
    function getPersonhoodConfidence(address _user) external view returns (uint256) {
        require(this.hasValidPersonhood(_user), "No valid personhood");
        return personhoodRecords[_user].confidence;
    }
    
    /**
     * @dev Check if credential is valid
     */
    function isCredentialValid(bytes32 _credentialId) external view returns (bool) {
        Credential memory credential = credentials[_credentialId];
        return credential.id != bytes32(0) && 
               !credential.isRevoked && 
               block.timestamp < credential.expirationDate;
    }
    
    /**
     * @dev Get user's credentials
     */
    function getUserCredentials(address _user) external view returns (bytes32[] memory) {
        return userCredentials[_user];
    }
    
    /**
     * @dev Add authorized issuer
     */
    function addAuthorizedIssuer(address _issuer) external onlyOwner {
        authorizedIssuers[_issuer] = true;
    }
    
    /**
     * @dev Remove authorized issuer
     */
    function removeAuthorizedIssuer(address _issuer) external onlyOwner {
        authorizedIssuers[_issuer] = false;
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        owner = _newOwner;
    }
    
    /**
     * @dev Check if user meets minimum requirements for a service
     */
    function meetsRequirements(
        address _user,
        uint256 _minKYCTier,
        uint256 _minPersonhoodConfidence
    ) external view returns (bool) {
        bool hasKYC = this.hasValidKYC(_user);
        bool hasPersonhood = this.hasValidPersonhood(_user);
        
        if (!hasKYC || !hasPersonhood) {
            return false;
        }
        
        return kycRecords[_user].tier >= _minKYCTier &&
               personhoodRecords[_user].confidence >= _minPersonhoodConfidence;
    }
    
    /**
     * @dev Emergency pause function
     */
    bool public paused = false;
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    function pause() external onlyOwner {
        paused = true;
    }
    
    function unpause() external onlyOwner {
        paused = false;
    }
}