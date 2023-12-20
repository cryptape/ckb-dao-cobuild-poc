use ckb_std::{
    ckb_constants::Source,
    ckb_types::{bytes::Bytes, prelude::*},
    debug,
    high_level::{load_script, load_witness_args},
};

use alloc::vec::Vec;
use base64ct::{Base64UrlUnpadded, Encoding as _};
use ckb_hash::blake2b_256;
use ckb_transaction_cobuild::parse_message;
use core::result::Result;
use p256::ecdsa::{signature::Verifier, Signature, VerifyingKey};
use sha2::{Digest as _, Sha256};

use crate::error::Error;
use crate::generate_sighash_all::generate_sighash_all;

// See README.md
pub fn main() -> Result<(), Error> {
    let script = load_script()?;
    let args: Bytes = script.args().unpack();

    let (challenge, seal) = match parse_message() {
        Ok(cobuild_layout) => cobuild_layout,
        Err(err) => {
            debug!("co-build parse error: {:?}", err);
            parse_witness_args()?
        }
    };
    debug!("challenge {:?}", challenge);
    verify(args, challenge, seal)
}

fn parse_witness_args() -> Result<([u8; 32], Vec<u8>), Error> {
    let sighash = generate_sighash_all()?;
    let witness_args = load_witness_args(0, Source::GroupInput)?;
    let seal: Vec<u8> = witness_args
        .lock()
        .to_opt()
        .ok_or(Error::WitnessLayoutError)?
        .raw_data()
        .to_vec();

    Ok((sighash, seal))
}

const PUBKEY_HASH_SIZE: usize = 20;

const PUBKEY_POS: usize = 0;
const PUBKEY_SIZE: usize = 64;
const SIGNATURE_POS: usize = PUBKEY_POS + PUBKEY_SIZE;
const SIGNATURE_SIZE: usize = 64;
const AUTHENTICATOR_DATA_POS: usize = SIGNATURE_POS + SIGNATURE_SIZE;
const AUTHENTICATOR_DATA_SIZE: usize = 37;
const CLIENT_DATA_POS: usize = AUTHENTICATOR_DATA_POS + AUTHENTICATOR_DATA_SIZE;
const MIN_SEAL_SIZE: usize = CLIENT_DATA_POS + 1;

fn parse_pubkey(pubkey_slice: &[u8]) -> Result<VerifyingKey, Error> {
    let mut sec1 = Vec::with_capacity(PUBKEY_SIZE + 1);
    sec1.push(0x04u8);
    sec1.extend_from_slice(pubkey_slice);
    VerifyingKey::from_sec1_bytes(&sec1).map_err(|err| {
        debug!("PublicKeyFormatError: {}", err);
        Error::PublicKeyFormatError
    })
}

fn parse_signature(signature_slice: &[u8]) -> Result<Signature, Error> {
    Signature::from_slice(signature_slice).map_err(|err| {
        debug!("SignatureFormatError: {}", err);
        Error::SignatureFormatError
    })
}

const CLIENT_DATA_START_CHAR: u8 = '{' as u8;
const CLIENT_DATA_QUOTE_CHAR: u8 = '"' as u8;
// ,"challenge":
const CHALLENGE_PREFIX: [u8; 13] = [
    0x2cu8, 0x22u8, 0x63u8, 0x68u8, 0x61u8, 0x6cu8, 0x6cu8, 0x65u8, 0x6eu8, 0x67u8, 0x65u8, 0x22u8,
    0x3au8,
];

fn parse_challenge(client_data_slice: &[u8]) -> Result<[u8; 32], Error> {
    let prefix_pos = client_data_slice
        .windows(CHALLENGE_PREFIX.len())
        .position(|window| window == CHALLENGE_PREFIX)
        .ok_or_else(|| {
            debug!("ClientDataFormatError: prefix not found");
            Error::ClientDataFormatError
        })?;

    let start_quote_pos = prefix_pos + CHALLENGE_PREFIX.len();
    if client_data_slice.get(start_quote_pos).copied().unwrap_or(0) != CLIENT_DATA_QUOTE_CHAR {
        debug!("ClientDataFormatError: start quote not found");
        return Err(Error::ClientDataFormatError);
    }

    let client_data_pos = start_quote_pos + 1;
    let end_quote_pos = client_data_slice[client_data_pos..]
        .iter()
        .position(|char| *char == CLIENT_DATA_QUOTE_CHAR)
        .ok_or_else(|| {
            debug!("ClientDataFormatError: end quote not found");
            Error::ClientDataFormatError
        })?
        + client_data_pos;

    let challenge_base64 = &client_data_slice[client_data_pos..end_quote_pos];

    // base64 decode
    let mut challenge_hex = [0u8; 64];
    if let Err(err) = Base64UrlUnpadded::decode(challenge_base64, &mut challenge_hex) {
        debug!("ClientDataFormatError: base64 decode error {}", err);
        return Err(Error::ClientDataFormatError);
    }
    debug!(
        "challenge={}",
        core::str::from_utf8(&challenge_hex).unwrap_or_default()
    );

    // hex decode
    let mut challenge = [0u8; 32];
    if let Err(err) = base16ct::lower::decode(challenge_hex, &mut challenge) {
        debug!("ClientDataFormatError: hex decode error {}", err);
        return Err(Error::ClientDataFormatError);
    }

    Ok(challenge)
}

const SHA256_BLOCK_SIZE: usize = 32;

fn prepare_message(
    authenticator_data_slice: &[u8],
    client_data_slice: &[u8],
) -> Result<Vec<u8>, Error> {
    let mut message = Vec::with_capacity(AUTHENTICATOR_DATA_SIZE + SHA256_BLOCK_SIZE);
    message.extend_from_slice(authenticator_data_slice);

    let mut hasher = Sha256::new();
    hasher.update(client_data_slice);
    let client_data_hash = hasher.finalize();
    message.extend_from_slice(&client_data_hash);

    Ok(message)
}

fn pubkey_hash_equal(pubkey_hash_slice: &[u8], pubkey_slice: &[u8]) -> bool {
    let computed_pubkey_hash = blake2b_256(pubkey_slice);
    return &computed_pubkey_hash[..PUBKEY_HASH_SIZE] == pubkey_hash_slice;
}

fn verify(args: Bytes, challenge: [u8; 32], seal: Vec<u8>) -> Result<(), Error> {
    if seal.len() < MIN_SEAL_SIZE {
        debug!(
            "seal len {} is less than MIN_SEAL_SIZE {}",
            seal.len(),
            MIN_SEAL_SIZE
        );
        return Err(Error::SealFormatError);
    }
    if seal[CLIENT_DATA_POS] != CLIENT_DATA_START_CHAR {
        debug!(
            "client data at {} must be {{ but is {}",
            CLIENT_DATA_POS, seal[CLIENT_DATA_POS]
        );
        return Err(Error::SealFormatError);
    }

    let pubkey_hash_slice = &args[..PUBKEY_HASH_SIZE];
    let pubkey_slice = &seal[PUBKEY_POS..(PUBKEY_POS + PUBKEY_SIZE)];
    if !pubkey_hash_equal(pubkey_hash_slice, pubkey_slice) {
        debug!("PublicKeyHashUnmatchError");
        return Err(Error::PublicKeyHashUnmatchError);
    }

    let signature_slice = &seal[SIGNATURE_POS..(SIGNATURE_POS + SIGNATURE_SIZE)];
    let authenticator_data_slice =
        &seal[AUTHENTICATOR_DATA_POS..(AUTHENTICATOR_DATA_POS + AUTHENTICATOR_DATA_SIZE)];
    let client_data_slice = &seal[CLIENT_DATA_POS..];

    let pubkey = parse_pubkey(pubkey_slice)?;
    let signature = parse_signature(signature_slice)?;

    if parse_challenge(&client_data_slice)? != challenge {
        debug!("ChallengeUnmatchError");
        return Err(Error::ChallengeUnmatchError);
    }

    let message = prepare_message(authenticator_data_slice, client_data_slice)?;

    pubkey.verify(&message, &signature).map_err(|err| {
        debug!("SignatureVerifyingError: {}", err);
        Error::SignatureVerifyingError
    })?;

    Ok(())
}
