//! Derive dao action from tx.
use core::cmp;

use alloc::collections::BTreeMap;
use ckb_dao_cobuild_schemas::{DaoActionData, Deposit};
use ckb_std::{
    ckb_constants::Source,
    ckb_types::{bytes::Bytes, packed, prelude::*},
    high_level::{load_cell, load_cell_data, QueryIter},
};

use crate::{
    constants::{DAO_DEPOSIT_DATA, DAO_TYPE_SCRIPT},
    error::Error,
    error_code::ErrorCode,
    trace_error,
};

#[derive(Debug, Eq, PartialEq)]
pub struct DepositKey {
    to: Bytes,
    amount: Bytes,
}

#[derive(Default, Debug)]
pub struct DerivedDaoActionData {
    deposits: BTreeMap<DepositKey, usize>,
}

fn is_deposit_cell(index: usize, source: Source) -> bool {
    load_cell_data(index, source)
        .map(|data| data.as_ref() == DAO_DEPOSIT_DATA)
        .unwrap_or(false)
}

impl DerivedDaoActionData {
    /// Derive dao action from the tx.
    pub fn derive() -> Self {
        #[allow(clippy::mutable_key_type)]
        let deposits = QueryIter::new(load_cell, Source::Output)
            .enumerate()
            .filter(|(index, cell_output)| {
                cell_output.type_().as_slice() == DAO_TYPE_SCRIPT
                    && is_deposit_cell(*index, Source::Output)
            })
            .map(|(index, cell_output)| ((&cell_output).into(), index))
            .collect();

        Self { deposits }
    }

    /// Ensure all derived operations have been found in tx.
    pub fn complete(self) -> Result<(), Error> {
        match self.deposits.into_values().next() {
            Some(index) => Err(trace_error!(
                ErrorCode::NotCoverred,
                "tx output {} not coverred by dao action",
                index
            )),
            None => Ok(()),
        }
    }

    pub fn verify(&mut self, dao_action_data: DaoActionData) -> Result<(), Error> {
        for deposit in dao_action_data.deposits().into_iter() {
            self.verify_deposit(deposit)?;
        }

        Ok(())
    }

    fn verify_deposit(&mut self, deposit: Deposit) -> Result<(), Error> {
        match self.deposits.remove(&(&deposit).into()) {
            Some(_) => Ok(()),
            None => Err(trace_error!(
                ErrorCode::NotFound,
                "deposit not found in tx: {}",
                deposit
            )),
        }
    }
}

impl From<&packed::CellOutput> for DepositKey {
    fn from(value: &packed::CellOutput) -> Self {
        Self {
            to: value.lock().as_bytes(),
            amount: value.capacity().as_bytes(),
        }
    }
}

impl From<&Deposit> for DepositKey {
    fn from(value: &Deposit) -> Self {
        Self {
            to: value.to().as_bytes(),
            amount: value.amount().as_bytes(),
        }
    }
}

impl PartialOrd for DepositKey {
    fn partial_cmp(&self, other: &Self) -> Option<cmp::Ordering> {
        match self.to.partial_cmp(&other.to) {
            Some(cmp::Ordering::Equal) => self.amount.partial_cmp(&other.amount),
            other => other,
        }
    }
}

impl Ord for DepositKey {
    fn cmp(&self, other: &Self) -> cmp::Ordering {
        match self.to.cmp(&other.to) {
            cmp::Ordering::Equal => self.amount.cmp(&other.amount),
            other => other,
        }
    }
}
