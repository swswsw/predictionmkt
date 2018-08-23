/**
 * example of doing signature
 * sign and verify signature
 * 
 * this comes from: https://github.com/mappum/coins/blob/master/client.js
 */

//let { post } = require('axios');
let secp = require('secp256k1');
let { sha256, addressHash } = require('./common.js');
let getSigHash = require('./sigHash.js');

let priv = sha256('lol'); // sample private key
let pub = secp.publicKeyCreate(priv); // create public key
console.log(addressHash(pub)); // create address

let priv2 = sha256('wtf')
let pub2 = secp.publicKeyCreate(priv2)
let addr2 = addressHash(pub2)

async function main () {
  let tx = {
    from: {
      amount: 5,
      pubkey: pub,
      sequence: 0
    },
    to: {
      amount: 5,
      address: addr2
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

  //let res = await post('http://localhost:3000/txs', tx)
  //console.log(res.data)


  // verify signature
  if (!secp.verify(sigHash, signature, pub)) {
    throw Error('Invalid signature')
  } else {
    console.log("signature verified! ***");
  }
}
main()

