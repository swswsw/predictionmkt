/**
 * common operations
 */
let { post, get } = require('axios');
let secp = require('secp256k1');
let { sha256, addressHash } = require('../common.js');
let getSigHash = require('../sigHash.js');



/**
 * sending a tx.
 * adding pubkey and signature
 */
async function sendTx (tx, privkey) {
  signTx(tx, privkey);  

  let res = await post('http://localhost:3000/txs', tx);
  console.log("tx resp: ", res.data);
  return res.data;
}

/**
 * sign tx.
 * add "from" and "to" onto tx
 * "from" contains pubkey and signature
 * @param {*} tx [object][in/out]
 * @param {*} privkey 
 */
function signTx(tx, privkey) {
  // add "from" and "to" onto tx
  // "from" contains pubkey and signature
  let pubkey = secp.publicKeyCreate(privkey); // create public key
  let from = {}
  let to = {};

  if (typeof tx.from === "undefined") {
    tx.from = from;
  }
  
  if (typeof tx.to === "undefined") {
    tx.to = to;
  }

  tx.from.pubkey = pubkey;
  tx.from.sequence = 0;

  // sign tx
  let sigHash = getSigHash(tx)
  console.log("sighash: ", sigHash);
  let sigHashHex = sigHash.toString('hex');
  console.log("sighash hex: ", sigHashHex);

  let signature = secp.sign(sigHash, privkey).signature;
  tx.from.signature = signature;
  console.log("signature: ", signature);
  let sigHex = signature.toString('hex');
  console.log("signature hex: ", sigHex);
}

async function getState() {
  let res = await get('http://localhost:3000/state');
  console.log("state: ", res.data);
  return res.data;
}

module.exports = {
  sendTx: sendTx,
  signTx: signTx,
  getState: getState,
}
