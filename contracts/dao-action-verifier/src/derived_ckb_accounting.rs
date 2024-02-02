use alloc::collections::BTreeMap;
use ckb_dao_cobuild_schemas::{Capacity, DaoActionData};
use ckb_std::{
    ckb_constants::Source,
    ckb_types::prelude::*,
    high_level::{load_cell, load_input_out_point, QueryIter},
};

use crate::{
    constants::DAO_TYPE_SCRIPT,
    dao::is_deposit_cell,
    error::Error,
    error_code::ErrorCode,
    keys::{AccountingKey, CellPointerKey},
    trace_error,
};

#[derive(Default, Debug)]
pub struct DerivedCkbAccounting {
    inputs: BTreeMap<AccountingKey, u128>,
    outputs: BTreeMap<AccountingKey, u128>,
    // cache componsations for deposit from
    componsations: BTreeMap<CellPointerKey, u64>,
}

fn unpack_capacity(capacity: Capacity) -> u64 {
    let mut buf = [0u8; 8];
    buf.copy_from_slice(capacity.as_slice());
    u64::from_le_bytes(buf)
}

#[allow(clippy::mutable_key_type)]
fn tally_input(key: &AccountingKey, componsations: &BTreeMap<CellPointerKey, u64>) -> u128 {
    // Exclude deposit cells, which must go to the corresponding withdraw cell.
    QueryIter::new(load_cell, Source::Input)
        .enumerate()
        .filter(|(index, cell_output)| {
            cell_output.lock().as_slice() == key.as_slice()
                && !(cell_output.type_().as_slice() == DAO_TYPE_SCRIPT
                    && is_deposit_cell(*index, Source::Input))
        })
        .fold(0u128, |acc, (index, cell_output)| {
            let componsation = if cell_output.type_().as_slice() == DAO_TYPE_SCRIPT {
                let key = load_input_out_point(index, Source::Input)
                    .expect("load input")
                    .into();
                componsations
                    .get(&key)
                    .copied()
                    .expect("componsation exists")
            } else {
                0
            };
            acc + cell_output.capacity().unpack() as u128 + componsation as u128
        })
}

fn tally_output(key: &AccountingKey) -> u128 {
    // Exclude withdraw cells, which must come from the corresponding deposit cell.
    QueryIter::new(load_cell, Source::Output)
        .enumerate()
        .filter(|(index, cell_output)| {
            cell_output.lock().as_slice() == key.as_slice()
                && (cell_output.type_().as_slice() != DAO_TYPE_SCRIPT
                    || is_deposit_cell(*index, Source::Output))
        })
        .fold(0u128, |acc, (_index, cell_output)| {
            acc + cell_output.capacity().unpack() as u128
        })
}

impl DerivedCkbAccounting {
    pub fn derive(&mut self, data: &DaoActionData) {
        for deposit in data.deposits().into_iter() {
            let total = self.inputs.entry(deposit.from().into()).or_default();
            *total += unpack_capacity(deposit.amount()) as u128;
        }
        for claim in data.claims().into_iter() {
            let componsation = unpack_capacity(claim.withdraw_info().componsation_amount());

            let total = self.outputs.entry(claim.to().into()).or_default();
            *total += unpack_capacity(claim.deposit_info().amount()) as u128 + componsation as u128;

            self.componsations
                .insert((&claim.cell_pointer()).into(), componsation);
        }
    }

    pub fn verify(self) -> Result<(), Error> {
        #[allow(clippy::mutable_key_type)]
        let componsations = self.componsations;
        for (key, expected) in self.inputs.into_iter() {
            let actual = tally_input(&key, &componsations);
            if actual < expected {
                return Err(trace_error!(
                    ErrorCode::InsufficientDepositFrom,
                    "expect deposit {} from {:?}, got {}",
                    expected,
                    key,
                    actual
                ));
            }
        }
        for (key, expected) in self.outputs.into_iter() {
            let actual = tally_output(&key);
            if actual < expected {
                return Err(trace_error!(
                    ErrorCode::InsufficientClaimTo,
                    "expect claim {} to {:?}, got {}",
                    expected,
                    key,
                    actual
                ));
            }
        }

        Ok(())
    }
}
