const path = require('path');
const fs = require('fs');
const snarkjs = require('snarkjs');

async function runSetup() {
  const buildDir = path.join(__dirname, 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  const r1csPath = path.join(buildDir, 'artwork_identity.r1cs');
  if (!fs.existsSync(r1csPath)) {
    console.error('Error: artwork_identity.r1cs does not exist. Please compile the circuit first.');
    process.exit(1);
  }

  const pot0Path = path.join(buildDir, 'pot10_0000.ptau');
  const pot1Path = path.join(buildDir, 'pot10_0001.ptau');
  const potFinalPath = path.join(buildDir, 'pot10_final.ptau');
  const zkey0Path = path.join(buildDir, 'artwork_identity_0000.zkey');
  const zkeyFinalPath = path.join(buildDir, 'artwork_identity_final.zkey');
  const vkeyPath = path.join(buildDir, 'verification_key.json');

  console.log('1. Generating Powers of Tau (bn128, power 10)...');
  await snarkjs.powersOfTau.newAccumulator('bn128', 10, pot0Path);

  console.log('2. Contributing to Powers of Tau ceremony...');
  await snarkjs.powersOfTau.contribute(pot0Path, pot1Path, 'GhostArt Contributor', 'ghost_art_entropy_nonce_12345');

  console.log('3. Preparing Phase 2...');
  await snarkjs.powersOfTau.preparePhase2(pot1Path, potFinalPath);

  console.log('4. Groth16 circuit setup...');
  await snarkjs.zKey.newZKey(r1csPath, potFinalPath, zkey0Path);

  console.log('5. Contributing to circuit zkey...');
  await snarkjs.zKey.contribute(zkey0Path, zkeyFinalPath, 'GhostArt Verifier', 'ghost_art_entropy_seed_98765');

  console.log('6. Exporting verification key...');
  const vKey = await snarkjs.zKey.exportVerificationKey(zkeyFinalPath);
  fs.writeFileSync(vkeyPath, JSON.stringify(vKey, null, 2));

  console.log('Setup successfully completed!');
  console.log('Verification key written to:', vkeyPath);
  console.log('Proving key written to:', zkeyFinalPath);
}

runSetup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Setup failed:', err);
    process.exit(1);
  });
