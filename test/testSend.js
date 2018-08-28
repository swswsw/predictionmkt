/**
 * test send tokens to another address
 */
let { post, get } = require('axios');
let secp = require('secp256k1');
let { sha256, addressHash } = require('../common.js');
let getSigHash = require('../sigHash.js');

//let priv = sha256('463852363a38c0105fc1169995696fb484ec11710ba174b3994c50baa5159423'); // sample private key
let priv = Buffer.from("463852363a38c0105fc1169995696fb484ec11710ba174b3994c50baa5159423", "hex"); // bob's private key
let pub = secp.publicKeyCreate(priv); // create public key
console.log(addressHash(pub)); // create address

let toAddr = "5wvwWgKP3Qfw1akQoXWg4NtKmzx5v4dTj";

async function main () {
  let tx = {
    type: "send",
    from: {
      amount: 10,
      pubkey: pub,
      sequence: 0
    },
    to: {
      address: toAddr,
    }
  }

  // sign tx
  let sigHash = getSigHash(tx)
  console.log("sighash: ", sigHash);
  let sigHashHex = sigHash.toString('hex');
  console.log("sighash hex: ", sigHashHex);

  let signature = secp.sign(sigHash, priv).signature;
  tx.from.signature = signature;
  console.log("signature: ", signature);
  let sigHex = signature.toString('hex');
  console.log("signature hex: ", sigHex);

  let res = await post('http://localhost:3000/txs', tx);
  console.log("tx resp", res.data);

  
}
main()
