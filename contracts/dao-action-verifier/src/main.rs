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

use ckb_dao_cobuild_schemas::{DaoActionData, DaoActionDataReader};
use ckb_std::ckb_types::{bytes::Bytes, prelude::*};
use ckb_transaction_cobuild::fetch_message;

mod constants;
mod dao;
mod derived_ckb_accounting;
mod derived_dao_action_data;
mod error;
mod error_code;
mod keys;

use crate::{
    constants::DAO_SCRIPT_HASH, derived_ckb_accounting::DerivedCkbAccounting,
    derived_dao_action_data::DerivedDaoActionData, error::Error,
};

pub fn program_entry() -> i8 {
    match verify() {
        Ok(_) => 0,
        Err(err) => err.into(),
    }
}

fn verify() -> Result<(), Error> {
    if let Ok(Some(message)) = fetch_message() {
        let mut derived_dao_action_data = DerivedDaoActionData::derive();
        let mut derived_ckb_accounting = DerivedCkbAccounting::default();

        for action in message.actions().into_iter() {
            if action.script_hash().as_slice() == DAO_SCRIPT_HASH {
                let dao_action_data = decode_dao_action_data(action.data().raw_data())?;
                derived_dao_action_data.verify(&dao_action_data)?;
                derived_ckb_accounting.derive(&dao_action_data);
            }
        }

        derived_dao_action_data.complete()?;
        derived_ckb_accounting.verify()?;
    }

    Ok(())
}

fn decode_dao_action_data(data: Bytes) -> Result<DaoActionData, Error> {
    DaoActionDataReader::from_slice(&data).map_err(|err| trace_error!(err))?;
    Ok(DaoActionData::new_unchecked(data))
}
