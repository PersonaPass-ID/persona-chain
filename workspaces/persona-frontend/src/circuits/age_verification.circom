pragma circom 2.0.0;

// Age Verification Circuit
// Proves that age is above a minimum threshold without revealing actual age
template AgeVerification() {
    // Private inputs (secrets)
    signal private input age;
    signal private input salt;
    
    // Public inputs
    signal input minAge;
    signal input hashedAge;
    
    // Output
    signal output isAboveAge;
    
    // Components
    component hasher = Poseidon(2);
    component geq = GreaterEqThan(8); // 8 bits allows ages up to 255
    
    // Verify age hash
    hasher.inputs[0] <== age;
    hasher.inputs[1] <== salt;
    hashedAge === hasher.out;
    
    // Check if age >= minAge
    geq.in[0] <== age;
    geq.in[1] <== minAge;
    
    // Output 1 if age >= minAge, 0 otherwise
    isAboveAge <== geq.out;
}

// Greater than or equal comparison
template GreaterEqThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;
    
    // Check if in[0] >= in[1]
    component lt = LessThan(n+1);
    lt.in[0] <== in[1];
    lt.in[1] <== in[0] + 1;
    
    out <== lt.out;
}

// Less than comparison (from circomlib)
template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;

    component n2b = Num2Bits(n+1);

    n2b.in <== in[0] + (1<<n) - in[1];

    out <== 1 - n2b.out[n];
}

// Number to bits conversion (from circomlib)
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

// Poseidon hash function
template Poseidon(nInputs) {
    signal input inputs[nInputs];
    signal output out;
    
    // Simplified Poseidon implementation
    // In production, use the full circomlib Poseidon
    var sum = 0;
    for (var i = 0; i < nInputs; i++) {
        sum += inputs[i];
    }
    out <== sum; // Simplified for demo - use real Poseidon in production
}

component main = AgeVerification();