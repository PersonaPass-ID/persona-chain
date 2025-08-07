pragma circom 2.0.0;

// PersonaPass Zero-Knowledge Jurisdiction/Residency Verification Circuit
// Proves user is from allowed jurisdiction without revealing exact location
// Supports multiple allowed regions and privacy-preserving validation

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/switcher.circom";

template JurisdictionProof(maxRegions) {
    // Private inputs
    signal private input userRegion;         // Hash of user's actual region
    signal private input userSalt;           // Salt for user region commitment
    signal private input secret;             // User secret for nullifier
    
    // Public inputs  
    signal input allowedRegions[maxRegions]; // Array of allowed region hashes
    signal input regionCommitment;           // Commitment to user's region
    signal input nullifierHash;             // Nullifier to prevent reuse
    signal input numAllowedRegions;         // Actual number of regions (≤ maxRegions)
    
    // Outputs
    signal output isFromAllowedRegion;      // 1 if user is from allowed region
    signal output commitmentValid;          // 1 if commitment is valid
    
    // Verify region commitment using Poseidon hash
    component poseidonCommit = Poseidon(2);
    poseidonCommit.inputs[0] <== userRegion;
    poseidonCommit.inputs[1] <== userSalt;
    
    component commitmentCheck = IsEqual();
    commitmentCheck.in[0] <== poseidonCommit.out;
    commitmentCheck.in[1] <== regionCommitment;
    commitmentValid <== commitmentCheck.out;
    
    // Check if user region matches any allowed region
    component regionMatches[maxRegions];
    signal regionMatchResults[maxRegions];
    
    for (var i = 0; i < maxRegions; i++) {
        regionMatches[i] = IsEqual();
        regionMatches[i].in[0] <== userRegion;
        regionMatches[i].in[1] <== allowedRegions[i];
        
        // Only count matches for regions within numAllowedRegions
        component isValidIndex = LessEqThan(8);
        isValidIndex.in[0] <== i + 1;
        isValidIndex.in[1] <== numAllowedRegions;
        
        component andGate = AND();
        andGate.a <== regionMatches[i].out;
        andGate.b <== isValidIndex.out;
        
        regionMatchResults[i] <== andGate.out;
    }
    
    // Sum all region matches (should be 1 if valid, 0 if not)
    component sumMatches = CalculateTotal(maxRegions);
    for (var i = 0; i < maxRegions; i++) {
        sumMatches.nums[i] <== regionMatchResults[i];
    }
    
    // Check that exactly one region matches
    component hasMatch = IsEqual();
    hasMatch.in[0] <== sumMatches.sum;
    hasMatch.in[1] <== 1;
    
    // Generate and verify nullifier
    component nullifierGen = Poseidon(2);
    nullifierGen.inputs[0] <== secret;
    nullifierGen.inputs[1] <== regionCommitment;
    
    component nullifierCheck = IsEqual();
    nullifierCheck.in[0] <== nullifierGen.out;
    nullifierCheck.in[1] <== nullifierHash;
    
    // Final validation: commitment valid AND region matches AND nullifier correct
    component and1 = AND();
    and1.a <== commitmentValid;
    and1.b <== hasMatch.out;
    
    component and2 = AND();
    and2.a <== and1.out;
    and2.b <== nullifierCheck.out;
    
    isFromAllowedRegion <== and2.out;
}

// Helper template to calculate sum
template CalculateTotal(n) {
    signal input nums[n];
    signal output sum;
    
    component sumComponents[n-1];
    if (n == 1) {
        sum <== nums[0];
    } else {
        sumComponents[0] = QuinSelector(2);
        sumComponents[0].in[0] <== 0;
        sumComponents[0].in[1] <== nums[0] + nums[1];
        sumComponents[0].index <== 1;
        
        for (var i = 1; i < n-1; i++) {
            sumComponents[i] = QuinSelector(2);
            sumComponents[i].in[0] <== 0;
            sumComponents[i].in[1] <== sumComponents[i-1].out + nums[i+1];
            sumComponents[i].index <== 1;
        }
        sum <== sumComponents[n-2].out;
    }
}

// Instantiate circuit for up to 16 allowed regions
component main = JurisdictionProof(16);