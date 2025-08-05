pragma circom 2.0.0;

// PersonaPass Zero-Knowledge Age Verification Circuit
// Proves age >= minimum without revealing birthdate
// Uses circomlib for safe comparisons

include "circomlib/circuits/comparators.circom";

template AgeVerification() {
    // Private inputs (never revealed on-chain)
    signal input birthdate;              // Unix timestamp in seconds
    signal input currentDate;            // Unix timestamp in seconds
    
    // Public inputs
    signal input minimumAgeInSeconds;    // Minimum age requirement in seconds
    
    // Output
    signal output isOverMinimumAge;      // 1 if over age, 0 if not
    
    // Calculate age in seconds
    signal ageInSeconds;
    ageInSeconds <== currentDate - birthdate;
    
    // Use circomlib's GreaterEqThan for safe comparison
    // 32 bits should be enough for age in seconds (up to ~136 years)
    component geq = GreaterEqThan(32);
    geq.in[0] <== ageInSeconds;
    geq.in[1] <== minimumAgeInSeconds;
    
    isOverMinimumAge <== geq.out;
}

component main = AgeVerification();