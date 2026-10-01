const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { buildPoseidon } = require('circomlibjs');

const SNARK_FIELD = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

function toFieldElement(val) {
  if (typeof val === 'bigint') return val % SNARK_FIELD;
  const str = val.toString().trim();
  if (str.startsWith('0x') || str.startsWith('0X')) {
    return BigInt(str) % SNARK_FIELD;
  }
  if (/[a-fA-F]/.test(str)) {
    return BigInt('0x' + str) % SNARK_FIELD;
  }
  return BigInt(str) % SNARK_FIELD;
}

function generateRandomSecret() {
  const buf = crypto.randomBytes(31);
  return BigInt('0x' + buf.toString('hex')) % SNARK_FIELD;
}

async function computeCommitment(fingerprintInput, secretInput) {
  const poseidon = await buildPoseidon();

  const fingerprintField = fingerprintInput ? toFieldElement(fingerprintInput) : toFieldElement('8000000000000000');
  const secretField = secretInput ? toFieldElement(secretInput) : generateRandomSecret();

  const hash = poseidon([fingerprintField, secretField]);
  const commitmentStr = poseidon.F.toString(hash);

  return {
    fingerprint: fingerprintField.toString(),
    secret: secretField.toString(),
    commitment: commitmentStr,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const fingerprintArg = args[0];
  const secretArg = args[1];

  const result = await computeCommitment(fingerprintArg, secretArg);

  // If invoked directly from CLI, write to input.json by default
  const inputJsonPath = path.join(__dirname, 'input.json');
  fs.writeFileSync(inputJsonPath, JSON.stringify(result, null, 2));

  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  computeCommitment,
  toFieldElement,
  generateRandomSecret,
  SNARK_FIELD,
};
