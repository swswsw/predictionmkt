/**
 * example for create private, public key, address
 * 
 * this comes from: 
 * https://github.com/mappum/coins/blob/master/bin.js
 * https://github.com/mappum/coins/blob/master/client.js
 */

let { randomBytes } = require('crypto');
let { sha256, addressHash } = require('./common.js');
let secp = require('secp256k1');

// create private key
let privkey = randomBytes(32);
console.log('priv key: ', privkey);

// private key in hex
let privkeyHex = privkey.toString('hex');
console.log('priv key hex: ', privkeyHex);

// create public key
let pubkey = secp.publicKeyCreate(privkey);
console.log("pub key: ", pubkey);
let pubkeyHex = pubkey.toString('hex');
console.log('pub key hex: ', pubkeyHex);

// create address
console.log("addr: ", addressHash(pubkey));
