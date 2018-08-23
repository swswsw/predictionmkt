# cryptography_trial
examples of some simple cryptography stuffs
- create new private key/public key pair
- create address
- sign (create a signature)
- verify a signature

platform: node.js

private/public key scheme: secp256k1

address creation
1. ripemd160(sha256(public_key))
2. base58 encode it

sign signature
1. normalize tx
2. serialize tx
3. sha256 hash tx
4. use secp256k1 library's sign() to sign the sha256 hash.

verify signature
1. use secp256k1 library's verify() to verify the signature
