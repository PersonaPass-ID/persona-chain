pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";

template SimpleAgeVerification() {
    signal input age;
    signal input minAge;
    signal output isValid;
    
    component geq = GreaterEqThan(8);
    geq.in[0] <== age;
    geq.in[1] <== minAge;
    
    isValid <== geq.out;
}

component main = SimpleAgeVerification();