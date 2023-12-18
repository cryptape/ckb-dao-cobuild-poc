use crate::error::Error;
use ckb_hash::{new_blake2b, Blake2b};
use ckb_std::{
    ckb_constants::{InputField, Source},
    ckb_types::{bytes::Bytes, packed, prelude::*},
    debug,
    high_level::{load_tx_hash, load_witness},
    syscalls::{self, load_input_by_field, SysError},
};

pub const ONE_BATCH_SIZE: usize = 32768;

// Copy from https://github.com/nervosnetwork/ckb-auth/blob/main/ckb-auth-rs/src/generate_sighash_all.rs
//
// Instead of filling the lock witness to zeros, this variant sets the lock field to none.
pub fn generate_sighash_all() -> Result<[u8; 32], Error> {
    let witness = load_witness(0, Source::GroupInput).map_err(|err| {
        debug!(
            "WitnessLayoutError: failed to load witness for GroupInput 0: {:?}",
            err
        );
        Error::WitnessLayoutError
    })?;
    // read WitnessArgs and verify it in strict (non-compatible) mode.
    let witness_args = packed::WitnessArgs::from_slice(&witness).map_err(|err| {
        debug!(
            "WitnessLayoutError: WitnessArgs verification failed {}",
            err
        );
        Error::WitnessLayoutError
    })?;
    let witness_for_signing = witness_args
        .as_builder()
        .lock((None as Option<Bytes>).pack())
        .build()
        .as_bytes();

    let tx_hash = load_tx_hash()?;

    // Prepare sign message.
    let mut blake2b_ctx = new_blake2b();
    blake2b_ctx.update(&tx_hash);
    blake2b_ctx.update(&(witness_for_signing.len() as u64).to_le_bytes());
    blake2b_ctx.update(&witness_for_signing);

    // Digest same group witnesses.
    let mut i = 1;
    loop {
        let sysret = load_and_hash_witness(&mut blake2b_ctx, 0, i, Source::GroupInput, true);
        match sysret {
            Err(SysError::IndexOutOfBound) => break,
            Err(x) => {
                debug!("WitnessLayoutError: {:?}", x);
                return Err(Error::WitnessLayoutError);
            }
            Ok(_) => i += 1,
        }
    }

    // Digest witnesses that not covered by inputs.
    let mut i = calculate_inputs_len()?;

    loop {
        let sysret = load_and_hash_witness(&mut blake2b_ctx, 0, i, Source::Input, true);
        match sysret {
            Err(SysError::IndexOutOfBound) => break,
            Err(x) => {
                debug!("WitnessLayoutError: {:?}", x);
                return Err(Error::WitnessLayoutError);
            }
            Ok(_) => i += 1,
        }
    }
    let mut msg = [0u8; 32];
    blake2b_ctx.finalize(&mut msg);
    Ok(msg)
}

fn load_and_hash_witness(
    ctx: &mut Blake2b,
    start: usize,
    index: usize,
    source: Source,
    hash_length: bool,
) -> Result<(), SysError> {
    let mut temp = [0u8; ONE_BATCH_SIZE];
    let len = syscalls::load_witness(&mut temp, start, index, source)?;
    if hash_length {
        ctx.update(&(len as u64).to_le_bytes());
    }
    let mut offset = if len > ONE_BATCH_SIZE {
        ONE_BATCH_SIZE
    } else {
        len
    };
    ctx.update(&temp[..offset]);
    while offset < len {
        let current_len = syscalls::load_witness(&mut temp, start + offset, index, source)?;
        let current_read = if current_len > ONE_BATCH_SIZE {
            ONE_BATCH_SIZE
        } else {
            current_len
        };
        ctx.update(&temp[..current_read]);
        offset += current_read;
    }
    Ok(())
}

fn calculate_inputs_len() -> Result<usize, Error> {
    let mut temp = [0u8; 8];
    let mut i = 0;
    loop {
        let sysret = load_input_by_field(&mut temp, 0, i, Source::Input, InputField::Since);
        match sysret {
            Err(SysError::IndexOutOfBound) => break,
            Err(x) => return Err(x.into()),
            Ok(_) => i += 1,
        }
    }
    Ok(i)
}
