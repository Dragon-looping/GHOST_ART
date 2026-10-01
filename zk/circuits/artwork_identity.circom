pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";

template ArtworkIdentity() {
    signal input fingerprint;
    signal input secret;
    signal input commitment;

    component poseidon = Poseidon(2);

    poseidon.inputs[0] <== fingerprint;
    poseidon.inputs[1] <== secret;

    commitment === poseidon.out;
}

component main {public [commitment]} = ArtworkIdentity();
