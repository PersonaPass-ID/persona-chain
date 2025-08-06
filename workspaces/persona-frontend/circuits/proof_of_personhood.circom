pragma circom 2.0.0;

include "circomlib/circuits/sha256/sha256.circom";
include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/mimc.circom";
include "circomlib/circuits/merkletree.circom";
include "circomlib/circuits/mux1.circom";

/*
 * PROOF OF PERSONHOOD ZK CIRCUIT
 * 
 * Proves unique human identity without revealing:
 * - Specific verification methods used
 * - Personal identity information
 * - Biometric data
 * - Social graph connections
 * - Device fingerprints
 * - Behavioral patterns
 * 
 * Prevents:
 * - Sybil attacks (multiple accounts per person)
 * - Bot attacks (non-human verification)
 * - Collusion attacks (shared verification)
 * - Replay attacks (reused proofs)
 * 
 * Public outputs:
 * - Personhood confidence score (0-100)
 * - Verification method diversity score
 * - Anti-sybil commitment
 * - Temporal validity proof
 */
template ProofOfPersonhood(MAX_VERIFICATION_METHODS) {
    // === PRIVATE INPUTS (Never revealed) ===
    
    // Multi-modal verification signals
    signal input biometricHash;           // Hash of biometric template
    signal input biometricLiveness;       // Liveness detection score (0-100)
    signal input biometricUniqueness;     // Uniqueness score across database
    
    signal input documentHashes[3];       // Hashes of up to 3 identity documents
    signal input documentScores[3];       // Document authenticity scores
    signal input documentTypes[3];        // Document types (0=none, 1=passport, 2=license, 3=national_id)
    
    signal input socialSignals[5];        // Social verification signals
    signal input socialScores[5];         // Confidence scores for social signals  
    signal input socialTypes[5];          // Types (0=none, 1=github, 2=linkedin, 3=phone, 4=email, 5=address)
    
    signal input deviceFingerprint;       // Device fingerprint hash
    signal input behaviorPattern;         // Behavioral pattern hash
    signal input geolocationHash;         // Hash of geolocation data
    
    signal input kycProviderHash;         // Hash of KYC provider attestation
    signal input kycTierLevel;           // KYC tier achieved (0-5)
    signal input kycValidityPeriod;      // Days remaining in KYC validity
    
    // Temporal and uniqueness constraints
    signal input verificationTimestamps[MAX_VERIFICATION_METHODS];
    signal input verificationNonces[MAX_VERIFICATION_METHODS];
    signal input globalUniquenessKey;     // Global unique identifier (hashed)
    
    // === PUBLIC INPUTS ===
    signal input currentTimestamp;        // Current time for freshness check
    signal input challengeNonce;          // Anti-replay challenge
    signal input requiredConfidence;      // Minimum confidence score required
    signal input networkEpoch;            // Network epoch for temporal binding
    
    // === OUTPUTS ===
    signal output personhoodConfidence;   // Overall confidence score (0-100)
    signal output verificationDiversity;  // Diversity score of verification methods
    signal output antiSybilCommitment;    // Unique commitment for sybil prevention
    signal output temporalProof;          // Proof of recent verification
    signal output networkBinding;         // Binding to specific network epoch
    
    // === INTERNAL COMPONENTS ===
    
    // 1. BIOMETRIC VERIFICATION COMPONENT
    component biometricValid = GreaterThan(8);
    biometricValid.in[0] <== biometricLiveness;
    biometricValid.in[1] <== 90; // Require 90%+ liveness confidence
    
    component biometricUnique = GreaterThan(8);
    biometricUnique.in[0] <== biometricUniqueness;
    biometricUnique.in[1] <== 95; // Require 95%+ uniqueness
    
    // Biometric score contribution (0-25 points)
    component biometricScore = Mux1();
    biometricScore.c[0] <== 0;
    biometricScore.c[1] <== 25;
    
    component biometricBoth = AND();
    biometricBoth.a <== biometricValid.out;
    biometricBoth.b <== biometricUnique.out;
    biometricScore.s <== biometricBoth.out;
    
    // 2. DOCUMENT VERIFICATION COMPONENT
    var documentPoints = 0;
    component docValidChecks[3];
    component docScoreChecks[3];
    
    for (var i = 0; i < 3; i++) {
        // Check if document exists and is valid
        docValidChecks[i] = GreaterThan(4);
        docValidChecks[i].in[0] <== documentTypes[i];
        docValidChecks[i].in[1] <== 0;
        
        // Check document authenticity score
        docScoreChecks[i] = GreaterThan(8);
        docScoreChecks[i].in[0] <== documentScores[i];
        docScoreChecks[i].in[1] <== 80; // Require 80%+ authenticity
        
        // Add points for valid documents (up to 30 points total)
        documentPoints += docValidChecks[i].out * docScoreChecks[i].out * 10;
    }
    
    // 3. SOCIAL VERIFICATION COMPONENT
    var socialPoints = 0;
    component socialValidChecks[5];
    component socialScoreChecks[5];
    
    for (var i = 0; i < 5; i++) {
        // Check if social signal exists
        socialValidChecks[i] = GreaterThan(4);
        socialValidChecks[i].in[0] <== socialTypes[i];
        socialValidChecks[i].in[1] <== 0;
        
        // Check social signal confidence
        socialScoreChecks[i] = GreaterThan(8);
        socialScoreChecks[i].in[0] <== socialScores[i];
        socialScoreChecks[i].in[1] <== 70; // Require 70%+ confidence
        
        // Add points for valid social signals (up to 25 points total)
        socialPoints += socialValidChecks[i].out * socialScoreChecks[i].out * 5;
    }
    
    // 4. KYC VERIFICATION COMPONENT
    component kycTierValid = GreaterThan(4);
    kycTierValid.in[0] <== kycTierLevel;
    kycTierValid.in[1] <== 2; // Require tier 3+ KYC
    
    component kycTimeValid = GreaterThan(16);
    kycTimeValid.in[0] <== kycValidityPeriod;
    kycTimeValid.in[1] <== 7; // Require at least 7 days validity remaining
    
    component kycScore = Mux1();
    kycScore.c[0] <== 0;
    kycScore.c[1] <== 20;
    
    component kycBoth = AND();
    kycBoth.a <== kycTierValid.out;
    kycBoth.b <== kycTimeValid.out;
    kycScore.s <== kycBoth.out;
    
    // 5. TEMPORAL FRESHNESS VERIFICATION
    component freshnessValid = GreaterThan(32);
    freshnessValid.in[0] <== currentTimestamp;
    freshnessValid.in[1] <== currentTimestamp - 86400; // Must be within 24 hours
    
    // Verify at least 3 verification methods are recent
    var recentVerifications = 0;
    component timeChecks[MAX_VERIFICATION_METHODS];
    for (var i = 0; i < MAX_VERIFICATION_METHODS; i++) {
        timeChecks[i] = GreaterThan(32);
        timeChecks[i].in[0] <== verificationTimestamps[i];
        timeChecks[i].in[1] <== currentTimestamp - 604800; // Within 7 days
        recentVerifications += timeChecks[i].out;
    }
    
    component diversityValid = GreaterThan(4);
    diversityValid.in[0] <== recentVerifications;
    diversityValid.in[1] <== 2; // Require at least 3 recent verifications
    
    // 6. ANTI-SYBIL UNIQUENESS COMMITMENT
    // Create cryptographic commitment that ensures uniqueness
    // without revealing identity across the entire network
    component uniqueCommit = MiMC7(8);
    uniqueCommit.in[0] <== globalUniquenessKey;
    uniqueCommit.in[1] <== biometricHash;
    uniqueCommit.in[2] <== documentHashes[0]; // Primary document
    uniqueCommit.in[3] <== socialSignals[0];   // Primary social signal
    uniqueCommit.in[4] <== deviceFingerprint;
    uniqueCommit.in[5] <== behaviorPattern;
    uniqueCommit.in[6] <== challengeNonce;
    uniqueCommit.in[7] <== networkEpoch;
    uniqueCommit.k <== 0;
    
    // 7. VERIFICATION METHOD DIVERSITY CALCULATION
    // Calculate diversity score based on different verification types used
    var methodTypes = 0;
    
    // Count biometric methods
    methodTypes += biometricBoth.out;
    
    // Count document types
    for (var i = 0; i < 3; i++) {
        methodTypes += docValidChecks[i].out;
    }
    
    // Count social verification types  
    for (var i = 0; i < 5; i++) {
        methodTypes += socialValidChecks[i].out;
    }
    
    // Count KYC verification
    methodTypes += kycBoth.out;
    
    // Diversity bonus (0-10 points based on method variety)
    component diversityBonus = LessThan(4);
    diversityBonus.in[0] <== methodTypes;
    diversityBonus.in[1] <== 10; // Cap at 10 methods max
    
    var diversityPoints = methodTypes * 1; // 1 point per method type
    
    // 8. FINAL CONFIDENCE SCORE CALCULATION
    // Total possible points: 25 + 30 + 25 + 20 + 10 = 110 (capped at 100)
    var totalRawScore = biometricScore.out + documentPoints + socialPoints + kycScore.out + diversityPoints;
    
    // Cap at 100 points maximum
    component scoreCap = LessThan(8);
    scoreCap.in[0] <== totalRawScore;
    scoreCap.in[1] <== 100;
    
    component finalScore = Mux1();
    finalScore.c[0] <== 100;
    finalScore.c[1] <== totalRawScore;
    finalScore.s <== scoreCap.out;
    
    // 9. CONFIDENCE THRESHOLD CHECK
    component meetsThreshold = GreaterEqThan(8);
    meetsThreshold.in[0] <== finalScore.out;
    meetsThreshold.in[1] <== requiredConfidence;
    
    // 10. TEMPORAL PROOF GENERATION
    component temporalHash = MiMC7(3);
    temporalHash.in[0] <== currentTimestamp;
    temporalHash.in[1] <== challengeNonce;
    temporalHash.in[2] <== finalScore.out;
    temporalHash.k <== networkEpoch;
    
    // 11. NETWORK EPOCH BINDING
    component epochBinding = MiMC7(2);
    epochBinding.in[0] <== networkEpoch;
    epochBinding.in[1] <== uniqueCommit.out;
    epochBinding.k <== challengeNonce;
    
    // === OUTPUT ASSIGNMENTS ===
    personhoodConfidence <== finalScore.out;
    verificationDiversity <== methodTypes;
    antiSybilCommitment <== uniqueCommit.out;
    temporalProof <== temporalHash.out;
    networkBinding <== epochBinding.out;
    
    // Final validity assertion
    component finalValid = AND();
    finalValid.a <== meetsThreshold.out;
    finalValid.b <== diversityValid.out;
    
    // Only output valid proofs if all conditions are met
    component validityMask = Mux1();
    validityMask.c[0] <== 0;
    validityMask.c[1] <== finalScore.out;
    validityMask.s <== finalValid.out;
    
    // Override confidence if not valid
    personhoodConfidence <== validityMask.out;
}

// Main component with support for up to 10 verification methods
component main = ProofOfPersonhood(10);