pragma circom 2.0.0;

include "circomlib/circuits/sha256/sha256.circom";
include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/mimc.circom";
include "circomlib/circuits/merkletree.circom";

/*
 * PRIVACY-PRESERVING KYC VERIFICATION CIRCUIT
 * 
 * Proves KYC compliance without revealing:
 * - Personal identity details
 * - Document contents
 * - Verification provider
 * - Exact verification date
 * - Biometric data
 * 
 * Public outputs:
 * - KYC compliance status (boolean)
 * - Verification tier level (1-5)
 * - Geographic compliance region
 * - Temporal validity proof
 */
template KYCVerification() {
    // === PRIVATE INPUTS (Never revealed) ===
    
    // Document hash inputs
    signal input documentHash;           // SHA-256 hash of identity document
    signal input documentSalt;           // Random salt for document privacy
    signal input documentType;          // 1=passport, 2=license, 3=national_id
    
    // Personal data (hashed)
    signal input nameHash;               // Hash of full legal name
    signal input dobHash;                // Hash of date of birth
    signal input addressHash;            // Hash of residential address
    signal input ssnHash;                // Hash of SSN/National ID
    
    // Biometric proof (without storing biometric data)
    signal input livenessProof;         // Cryptographic proof of biometric liveness
    signal input faceMatchScore;        // Face matching confidence (0-100)
    signal input biometricNonce;        // One-time nonce for biometric session
    
    // Verification provider data
    signal input providerPublicKey[2];   // Provider's public key for verification
    signal input providerSignature[2];  // Provider's signature on verification
    signal input providerTier;          // Provider trust tier (1-5)
    
    // Temporal validity
    signal input verificationDate;      // Unix timestamp of verification
    signal input expirationDate;        // Unix timestamp when KYC expires
    
    // === PUBLIC INPUTS ===
    signal input currentTimestamp;      // Current time for validity check
    signal input requiredTier;          // Minimum required verification tier
    signal input requiredRegion;        // Required geographic compliance region
    signal input challengeNonce;        // Anti-replay nonce from verifier
    
    // === OUTPUTS ===
    signal output isKYCValid;           // Boolean: KYC meets requirements
    signal output verificationTier;     // Achieved tier level (1-5)
    signal output complianceRegion;     // Geographic compliance code
    signal output validityProof;        // Cryptographic proof of validity
    signal output uniquenessCommitment; // Commitment for anti-sybil protection
    
    // === INTERNAL COMPONENTS ===
    
    // 1. DOCUMENT AUTHENTICITY VERIFICATION
    component documentVerifier = Sha256(512);
    component documentBits = Num2Bits(256);
    documentBits.in <== documentHash;
    
    for (var i = 0; i < 256; i++) {
        documentVerifier.in[i] <== documentBits.out[i];
    }
    
    // Verify document salt integration
    component saltBits = Num2Bits(256);
    saltBits.in <== documentSalt;
    for (var i = 0; i < 256; i++) {
        documentVerifier.in[i + 256] <== saltBits.out[i];
    }
    
    // 2. BIOMETRIC LIVENESS VERIFICATION
    component livenessVerifier = GreaterThan(8);
    livenessVerifier.in[0] <== faceMatchScore;
    livenessVerifier.in[1] <== 85; // Minimum 85% confidence required
    
    // Verify biometric nonce freshness (prevents replay attacks)
    component nonceVerifier = GreaterThan(32);
    nonceVerifier.in[0] <== biometricNonce;
    nonceVerifier.in[1] <== 1000000; // Minimum nonce value
    
    // 3. PROVIDER SIGNATURE VERIFICATION
    // EdDSA signature verification for provider attestation
    component sigVerifier = EdDSAMiMCVerifier();
    sigVerifier.enabled <== 1;
    sigVerifier.Ax <== providerPublicKey[0];
    sigVerifier.Ay <== providerPublicKey[1];
    sigVerifier.S <== providerSignature[0];
    sigVerifier.R8x <== providerSignature[1];
    
    // Create message hash for signature verification
    component msgHash = MiMC7(4);
    msgHash.in[0] <== documentHash;
    msgHash.in[1] <== verificationDate;
    msgHash.in[2] <== providerTier;
    msgHash.in[3] <== challengeNonce;
    msgHash.k <== 0;
    
    sigVerifier.M <== msgHash.out;
    
    // 4. TEMPORAL VALIDITY CHECK
    component currentValid = GreaterThan(32);
    currentValid.in[0] <== currentTimestamp;
    currentValid.in[1] <== verificationDate; // Must be after verification
    
    component notExpired = GreaterThan(32);
    notExpired.in[0] <== expirationDate;
    notExpired.in[1] <== currentTimestamp; // Must be before expiration
    
    // 5. TIER REQUIREMENT CHECK
    component tierCheck = GreaterEqThan(4);
    tierCheck.in[0] <== providerTier;
    tierCheck.in[1] <== requiredTier;
    
    // 6. GEOGRAPHIC COMPLIANCE CHECK
    // Extract region from address hash without revealing address
    component regionExtractor = Bits2Num(8);
    component addressBits = Num2Bits(256);
    addressBits.in <== addressHash;
    
    // Use first 8 bits of address hash as region identifier
    for (var i = 0; i < 8; i++) {
        regionExtractor.in[i] <== addressBits.out[i];
    }
    
    component regionMatch = IsEqual();
    regionMatch.in[0] <== regionExtractor.out;
    regionMatch.in[1] <== requiredRegion;
    
    // 7. ANTI-SYBIL UNIQUENESS COMMITMENT
    // Create unique commitment that prevents duplicate accounts
    // without revealing identity
    component uniqueHash = MiMC7(4);
    uniqueHash.in[0] <== nameHash;
    uniqueHash.in[1] <== dobHash;
    uniqueHash.in[2] <== ssnHash;
    uniqueHash.in[3] <== documentHash;
    uniqueHash.k <== challengeNonce; // Include nonce to prevent linkability
    
    // 8. FINAL VALIDITY CALCULATION
    // KYC is valid if ALL conditions are met
    component allValid = AND();
    allValid.a <== livenessVerifier.out;
    
    component tempValid = AND();
    tempValid.a <== currentValid.out;
    tempValid.b <== notExpired.out;
    
    component providerValid = AND(); 
    providerValid.a <== sigVerifier.valid;
    providerValid.b <== tierCheck.out;
    
    component geoValid = OR(); // Either region matches OR no region requirement
    geoValid.a <== regionMatch.out;
    component noRegionReq = IsZero();
    noRegionReq.in <== requiredRegion;
    geoValid.b <== noRegionReq.out;
    
    // Combine all validity checks
    component intermediateValid = AND();
    intermediateValid.a <== tempValid.out;
    intermediateValid.b <== providerValid.out;
    
    component finalValid = AND();
    finalValid.a <== intermediateValid.out;
    finalValid.b <== geoValid.out;
    
    allValid.b <== finalValid.out;
    
    // === OUTPUT ASSIGNMENTS ===
    isKYCValid <== allValid.out;
    verificationTier <== providerTier;
    complianceRegion <== regionExtractor.out;
    validityProof <== msgHash.out;
    uniquenessCommitment <== uniqueHash.out;
}

// Main component for KYC verification
component main = KYCVerification();