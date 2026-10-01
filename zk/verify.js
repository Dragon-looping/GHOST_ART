const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

async function verifyProof(proofData, publicSignalsData, vkeyPath) {
  const defaultVkeyPath = path.join(__dirname, 'build', 'verification_key.json');
  const finalVkeyPath = vkeyPath || defaultVkeyPath;

  if (!fs.existsSync(finalVkeyPath)) {
    throw new Error(`Verification key not found at: ${finalVkeyPath}`);
  }

  const vKey = JSON.parse(fs.readFileSync(finalVkeyPath, 'utf8'));
  const isValid = await snarkjs.groth16.verify(vKey, publicSignalsData, proofData);

  return isValid;
}

async function main() {
  const args = process.argv.slice(2);
  const proofArg = args[0];
  const publicSignalsArg = args[1];
  const vkeyArg = args[2];

  let proofData;
  let publicSignalsData;

  if (proofArg && fs.existsSync(proofArg)) {
    proofData = JSON.parse(fs.readFileSync(proofArg, 'utf8'));
  } else if (proofArg && proofArg.startsWith('{')) {
    proofData = JSON.parse(proofArg);
  } else {
    const defaultProofPath = path.join(__dirname, 'build', 'proof.json');
    proofData = JSON.parse(fs.readFileSync(defaultProofPath, 'utf8'));
  }

  if (publicSignalsArg && fs.existsSync(publicSignalsArg)) {
    publicSignalsData = JSON.parse(fs.readFileSync(publicSignalsArg, 'utf8'));
  } else if (publicSignalsArg && (publicSignalsArg.startsWith('[') || publicSignalsArg.startsWith('{'))) {
    publicSignalsData = JSON.parse(publicSignalsArg);
  } else {
    const defaultPublicPath = path.join(__dirname, 'build', 'public.json');
    publicSignalsData = JSON.parse(fs.readFileSync(defaultPublicPath, 'utf8'));
  }

  const isValid = await verifyProof(proofData, publicSignalsData, vkeyArg);

  const response = {
    valid: isValid,
    message: isValid
      ? 'Zero-knowledge proof verified'
      : 'Zero-knowledge proof verification failed',
  };

  console.log(JSON.stringify(response, null, 2));

  if (!isValid) {
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(JSON.stringify({ valid: false, message: err.message }, null, 2));
      process.exit(1);
    });
}

module.exports = {
  verifyProof,
};
