pragma circom 2.0.0;

// PersonaPass Enhanced Zero-Knowledge Age Verification Circuit
// Proves age >= minimum without revealing exact birthdate or current date
// Includes nullifier to prevent double-spending and privacy-preserving commitment

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/mimc.circom";
include "circomlib/circuits/poseidon.circom";

template AgeVerification() {
    // Private inputs (never revealed on-chain)
    signal private input birthdate;              // Unix timestamp in seconds
    signal private input currentDate;            // Unix timestamp in seconds
    signal private input salt;                   // Random salt for privacy
    signal private input secret;                 // User secret for nullifier
    
    // Public inputs
    signal input minimumAgeInSeconds;            // Minimum age requirement in seconds
    signal input ageCommitment;                  // Commitment to age using Poseidon hash
    signal input nullifierHash;                 // Nullifier to prevent reuse
    
    // Outputs
    signal output isOverMinimumAge;              // 1 if over age, 0 if not
    signal output commitmentValid;               // 1 if commitment is valid
    
    // Calculate age in seconds
    signal ageInSeconds;
    ageInSeconds <== currentDate - birthdate;
    
    // Verify age commitment using Poseidon hash
    component poseidon = Poseidon(3);
    poseidon.inputs[0] <== ageInSeconds;
    poseidon.inputs[1] <== salt;
    poseidon.inputs[2] <== secret;
    
    // Check that commitment matches
    component commitmentCheck = IsEqual();
    commitmentCheck.in[0] <== poseidon.out;
    commitmentCheck.in[1] <== ageCommitment;
    commitmentValid <== commitmentCheck.out;
    
    // Age comparison with safety checks
    component ageCheck = GreaterEqThan(32);
    ageCheck.in[0] <== ageInSeconds;
    ageCheck.in[1] <== minimumAgeInSeconds;
    
    // Ensure reasonable age bounds (between 0 and 150 years)
    component lowerBound = GreaterEqThan(32);
    lowerBound.in[0] <== ageInSeconds;
    lowerBound.in[1] <== 0;
    
    component upperBound = LessEqThan(32);
    upperBound.in[0] <== ageInSeconds;
    upperBound.in[1] <== 150 * 365 * 24 * 60 * 60; // 150 years in seconds
    
    // Generate nullifier to prevent double-spending
    component nullifierGen = Poseidon(2);
    nullifierGen.inputs[0] <== secret;
    nullifierGen.inputs[1] <== minimumAgeInSeconds;
    
    component nullifierCheck = IsEqual();
    nullifierCheck.in[0] <== nullifierGen.out;
    nullifierCheck.in[1] <== nullifierHash;
    
    // Final output: all constraints must be satisfied
    component and1 = AND();
    and1.a <== ageCheck.out;
    and1.b <== commitmentValid;
    
    component and2 = AND();
    and2.a <== and1.out;
    and2.b <== lowerBound.out;
    
    component and3 = AND();
    and3.a <== and2.out;
    and3.b <== upperBound.out;
    
    component and4 = AND();
    and4.a <== and3.out;
    and4.b <== nullifierCheck.out;
    
    isOverMinimumAge <== and4.out;
}

component main = AgeVerification();