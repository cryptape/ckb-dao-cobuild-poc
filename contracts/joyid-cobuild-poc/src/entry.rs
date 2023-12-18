// Import from `core` instead of from `std` since we are in no-std mode
use core::result::Result;

use ckb_std::debug;
use p256::ecdsa::{signature::Verifier, Signature, VerifyingKey};

use crate::error::Error;

// This is a lock that supports signing in JoyID via @joyid/ckb signChallenge method.
//
//     https://docs.joy.id/guide/ckb/sign-message
//
// ## Script Args
//
// Args is the first 20 bytes of the publick key hash. The hash algorithm is ckbhash, a.k.a,
// blake2b 256 with personalization "ckb-default-hash". The input is the raw bytes of ecdsa public
// keys, in another words, the uncompressed sec1 bytes without the first byte flag `0x04`.
//
// ## Seal
//
// The script supports both WithnessArgs and Co-Build layout. For both layouts, the seal structure
// is identical:
//
// - pubkey: 64 bytes. Raw bytes of the ecdsa public key (uncompressed sec1 without the flag byte).
// - signature: 64 bytes. The raw signature bytes.
// - message: the binary decoded from the `message` field returned from `signChallenge`.
//
// The layout determins where the seal is stored and what is the challenge passed to
// the JoyID API `signChallenge`.
//
// In the WitnessArgs layout, seal is stored in the witness at the same position as the first input
// cell in the script group. The witness is a serialized molecule WitnessArgs, and the seal is
// stored as the `lock` field. The challenge is the sighash same as in the system secp256k1
// lock.
//
// In the Co-Build layout, seal is stored in the `seal` field of `SighashAll` or `SighashAllOnly`.
// The challenge is the `message_digest` by combining skeleton hash and the typed message hash.
pub fn main() -> Result<(), Error> {
    let message = [
        0x2bu8, 0x8bu8, 0x05u8, 0xe1u8, 0xf0u8, 0x30u8, 0x3eu8, 0xfbu8, 0x89u8, 0x8fu8, 0xe4u8,
        0xd6u8, 0xdeu8, 0x60u8, 0x11u8, 0x98u8, 0xc7u8, 0xa7u8, 0xb8u8, 0x64u8, 0xabu8, 0xbeu8,
        0x6au8, 0x21u8, 0xc7u8, 0x3bu8, 0x2eu8, 0x78u8, 0x7eu8, 0x18u8, 0x7cu8, 0x52u8, 0x05u8,
        0x00u8, 0x00u8, 0x00u8, 0x00u8, 0x38u8, 0x48u8, 0x94u8, 0x41u8, 0x8cu8, 0xe0u8, 0x02u8,
        0x76u8, 0x9eu8, 0x96u8, 0xffu8, 0x7du8, 0x67u8, 0x03u8, 0xfcu8, 0xe9u8, 0xb5u8, 0xbau8,
        0x98u8, 0xb5u8, 0x6au8, 0xabu8, 0x18u8, 0x13u8, 0x49u8, 0xeeu8, 0xd4u8, 0x02u8, 0x14u8,
        0x6au8, 0x3eu8, 0x81u8,
    ];
    let pubkey = [
        0x04u8, 0x35u8, 0x38u8, 0xdfu8, 0xd5u8, 0x3au8, 0xd9u8, 0x3du8, 0x2eu8, 0x0au8, 0x6eu8,
        0x7fu8, 0x47u8, 0x02u8, 0x95u8, 0xdcu8, 0xd7u8, 0x10u8, 0x57u8, 0xd8u8, 0x25u8, 0xe1u8,
        0xf8u8, 0x72u8, 0x29u8, 0xe5u8, 0xafu8, 0xe2u8, 0xa9u8, 0x06u8, 0xaau8, 0x7cu8, 0xfcu8,
        0x09u8, 0x9fu8, 0xdfu8, 0xa0u8, 0x44u8, 0x42u8, 0xdau8, 0xc3u8, 0x35u8, 0x48u8, 0xb6u8,
        0x98u8, 0x8au8, 0xf8u8, 0xafu8, 0x58u8, 0xd2u8, 0x05u8, 0x25u8, 0x29u8, 0x08u8, 0x8fu8,
        0x7bu8, 0x73u8, 0xefu8, 0x00u8, 0x80u8, 0x0fu8, 0x7fu8, 0xbcu8, 0xddu8, 0xb3u8,
    ];
    let signature = [
        0xbeu8, 0xdeu8, 0xa4u8, 0x3au8, 0x55u8, 0x18u8, 0x5fu8, 0x12u8, 0xb4u8, 0x58u8, 0xecu8,
        0x3eu8, 0xc5u8, 0x90u8, 0x98u8, 0x6eu8, 0x8cu8, 0x79u8, 0x8fu8, 0xe2u8, 0x63u8, 0x64u8,
        0x24u8, 0xb1u8, 0x28u8, 0x55u8, 0xd2u8, 0x1eu8, 0x94u8, 0xb1u8, 0x87u8, 0xa8u8, 0x74u8,
        0xebu8, 0x37u8, 0x04u8, 0x47u8, 0x18u8, 0x63u8, 0xd9u8, 0x15u8, 0xb6u8, 0xe2u8, 0xcau8,
        0xe9u8, 0x32u8, 0xadu8, 0x60u8, 0xddu8, 0xd2u8, 0xbdu8, 0x13u8, 0x02u8, 0xebu8, 0xbdu8,
        0x11u8, 0x6fu8, 0xa1u8, 0xb3u8, 0x39u8, 0x64u8, 0x61u8, 0x80u8, 0x8du8,
    ];

    let verifying_key = VerifyingKey::from_sec1_bytes(&pubkey).map_err(|err| {
        debug!("PublicKeyFormatError: {}", err);
        Error::PublicKeyFormatError
    })?;
    let signature = Signature::from_slice(&signature).map_err(|err| {
        debug!("SignatureFormatError: {}", err);
        Error::SignatureFormatError
    })?;

    verifying_key.verify(&message, &signature).map_err(|err| {
        debug!("SignatureVerifyingError: {}", err);
        Error::SignatureVerifyingError
    })?;

    Ok(())
}
