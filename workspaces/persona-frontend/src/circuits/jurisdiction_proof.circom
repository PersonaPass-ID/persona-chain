pragma circom 2.0.0;

// Jurisdiction Proof Circuit
// Proves membership in a jurisdiction set without revealing exact jurisdiction
template JurisdictionProof() {
    // Private inputs
    signal private input jurisdiction; // Country code as number (US=1, EU countries=2-28, etc.)
    signal private input salt;
    
    // Public inputs
    signal input hashedJurisdiction;
    signal input allowedJurisdictions[32]; // Max 32 allowed jurisdictions
    signal input numAllowed; // Number of allowed jurisdictions
    
    // Output
    signal output isAllowed;
    
    // Components
    component hasher = Poseidon(2);
    component equalChecks[32];
    
    // Verify jurisdiction hash
    hasher.inputs[0] <== jurisdiction;
    hasher.inputs[1] <== salt;
    hashedJurisdiction === hasher.out;
    
    // Check if jurisdiction is in allowed list
    var sum = 0;
    for (var i = 0; i < 32; i++) {
        equalChecks[i] = IsEqual();
        equalChecks[i].in[0] <== jurisdiction;
        equalChecks[i].in[1] <== allowedJurisdictions[i];
        
        // Only count if i < numAllowed
        component lessThan = LessThan(6); // Up to 64 jurisdictions
        lessThan.in[0] <== i;
        lessThan.in[1] <== numAllowed;
        
        sum += equalChecks[i].out * lessThan.out;
    }
    
    // Convert sum to boolean (1 if any match, 0 if none)
    component isZero = IsZero();
    isZero.in <== sum;
    isAllowed <== 1 - isZero.out;
}

// Check if input is equal to zero
template IsZero() {
    signal input in;
    signal output out;

    signal inv;

    inv <-- in!=0 ? 1/in : 0;

    out <== -in*inv +1;
    in*out === 0;
}

// Check if two inputs are equal
template IsEqual() {
    signal input in[2];
    signal output out;

    component isz = IsZero();

    in[1] - in[0] ==> isz.in;

    isz.out ==> out;
}

// Less than comparison (reused from age verification)
template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;

    component n2b = Num2Bits(n+1);
    n2b.in <== in[0] + (1<<n) - in[1];
    out <== 1 - n2b.out[n];
}

template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var lc1=0;

    var e2 = 1;
    for (var i = 0; i<n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] -1 ) === 0;
        lc1 += out[i] * e2;
        e2 = e2+e2;
    }

    lc1 === in;
}

// Simplified Poseidon (use circomlib in production)
template Poseidon(nInputs) {
    signal input inputs[nInputs];
    signal output out;
    
    var sum = 0;
    for (var i = 0; i < nInputs; i++) {
        sum += inputs[i];
    }
    out <== sum;
}

component main = JurisdictionProof();