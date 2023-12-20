# joyid-cobuild-poc

This lock enables signing in JoyID using the @joyid/ckb signChallenge method.

> <https://docs.joy.id/guide/ckb/sign-message>

## ⚠️ Security Warning

This script uses a dependency [p256](https://docs.rs/p256/latest/p256/) which has never been independently audited!

USE AT YOUR OWN RISK!

## Script Args

The script `args` field is the first 20 bytes of the public key hash. The hash algorithm used is ckb-hash, a.k.a, blake2b 256 with the personalization "ckb-default-hash". The input consists of the uncompressed sec1 bytes of the ecdsa public key, excluding the first byte `0x04`.

## Seal

The script supports two layouts: WithnessArgs and Co-Build. In both layouts, the seal structure is the same.

- pubkey: 64 bytes. Raw bytes of the ecdsa public key (uncompressed sec1 without the flag byte).
- signature: 64 bytes. The raw signature bytes.
- message: the webauthn message binary decoded from the `message` field returned from `signChallenge`.

The layout determines where the seal is stored and what is the `challenge` passed to the JoyID API `signChallenge`.

The Co-Build layout stores the seal in the `seal` field of either `SighashAll` or `SighashAllOnly`. The `challenge` value is the `message_digest` by hashing the skeleton hash and the typed message hash.

The WitnessArgs layout stores the seal in the `lock` field of the serialized molecule structure `WitnessArgs`. This structure is located in the witness at the same position as the first input cell in the script group. The `challenge` value is calculated using the sighash-lock-none algorithm, which is similar with the system lock script `secp256k1`. In the secp256k1 lock, the `Witness.lock` field is filled with zeros. However, the sighash-lock-none algorithm duplicates the WitnessArgs and sets `lock` to none to address the issue that the webauthn message has a variable length. It is important to note that sighash-lock-none requires the witness to be a strict molecule buffer.

1. There's no unused bytes in the buffer. In other words, the buffer has no extra bytes in the end and has no holes.
2. Table has offsets for all the fields in the header.
3. The table field offsets are in ascending order.

The seal in both layouts is represented by the hex encoding of a 32-byte hash. It is written in lowercase and without the prefix `0x`.
