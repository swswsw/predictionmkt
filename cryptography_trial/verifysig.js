/**
 * example of verify signature
 */

// verify signature
if (!secp256k1.verify(sigHash, signature, pubkey)) {
  throw Error('Invalid signature')
}