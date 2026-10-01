const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

async function generateProof(inputData, wasmPath, zkeyPath) {
  const defaultWasm = path.join(__dirname, 'build', 'artwork_identity_js', 'artwork_identity.wasm');
  const defaultZkey = path.join(__dirname, 'build', 'artwork_identity_final.zkey');

  const finalWasm = wasmPath || defaultWasm;
  const finalZkey = zkeyPath || defaultZkey;

  if (!fs.existsSync(finalWasm)) {
    throw new Error(`Circuit WASM not found at: ${finalWasm}`);
  }
  if (!fs.existsSync(finalZkey)) {
    throw new Error(`Circuit zkey not found at: ${finalZkey}`);
  }

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputData,
    finalWasm,
    finalZkey
  );

  return { proof, publicSignals };
}

async function main() {
  const args = process.argv.slice(2);
  const inputArg = args[0];

  let inputData;
  if (inputArg && fs.existsSync(inputArg)) {
    inputData = JSON.parse(fs.readFileSync(inputArg, 'utf8'));
  } else if (inputArg && inputArg.startsWith('{')) {
    inputData = JSON.parse(inputArg);
  } else {
    const defaultInputPath = path.join(__dirname, 'input.json');
    if (!fs.existsSync(defaultInputPath)) {
      throw new Error(`Input file not found at: ${defaultInputPath}`);
    }
    inputData = JSON.parse(fs.readFileSync(defaultInputPath, 'utf8'));
  }

  const { proof, publicSignals } = await generateProof(inputData);

  const proofOutPath = path.join(__dirname, 'build', 'proof.json');
  const publicOutPath = path.join(__dirname, 'build', 'public.json');

  fs.writeFileSync(proofOutPath, JSON.stringify(proof, null, 2));
  fs.writeFileSync(publicOutPath, JSON.stringify(publicSignals, null, 2));

  console.log(JSON.stringify({ proof, publicSignals }, null, 2));
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = {
  generateProof,
};
