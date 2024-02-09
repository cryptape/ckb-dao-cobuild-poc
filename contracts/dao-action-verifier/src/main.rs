#![no_std]
#![cfg_attr(not(test), no_main)]

#[cfg(any(not(target_arch = "riscv64"), test))]
extern crate alloc;

#[cfg(all(target_arch = "riscv64", not(test)))]
use ckb_std::default_alloc;
#[cfg(all(target_arch = "riscv64", not(test)))]
ckb_std::entry!(program_entry);
#[cfg(all(target_arch = "riscv64", not(test)))]
default_alloc!();

use ckb_dao_cobuild_schemas::DaoActionDataReader;
use ckb_std::ckb_types::prelude::*;
use ckb_transaction_cobuild::fetch_message;

mod constants;
mod error;
mod error_code;

use crate::{constants::DAO_SCRIPT_HASH, error::Error};

pub fn program_entry() -> i8 {
    match verify() {
        Ok(_) => 0,
        Err(err) => err.into(),
    }
}

fn verify() -> Result<(), Error> {
    if let Ok(Some(message)) = fetch_message() {
        for action in message.actions().into_iter() {
            if action.script_hash().as_slice() == DAO_SCRIPT_HASH {
                verify_action_data(&action.data().raw_data())?;
            }
        }
    }

    // It's OK to not include DAO action data
    Ok(())
}

fn verify_action_data(data: &[u8]) -> Result<(), Error> {
    DaoActionDataReader::from_slice(data).map_err(|err| trace_error!(err))?;
    Ok(())
}
