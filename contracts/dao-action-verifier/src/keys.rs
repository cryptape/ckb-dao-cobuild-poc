use core::cmp;

use ckb_dao_cobuild_schemas::{Address, Deposit, OutPoint as DaoActionOutPoint};
use ckb_std::ckb_types::{bytes::Bytes, packed, prelude::*};

#[derive(Debug, Eq, PartialEq)]
pub struct DepositKey {
    to: Bytes,
    amount: Bytes,
}

#[derive(Debug, Eq, PartialEq)]
pub struct CellPointerKey {
    cell_pointer: Bytes,
}

pub type WithdrawKey = CellPointerKey;
pub type ClaimKey = CellPointerKey;

#[derive(Debug, Eq, PartialEq)]
pub struct AccountingKey {
    address: Bytes,
}

impl AccountingKey {
    pub fn as_slice(&self) -> &[u8] {
        self.address.as_ref()
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
        Some(self.cmp(other))
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

impl From<packed::OutPoint> for CellPointerKey {
    fn from(value: packed::OutPoint) -> Self {
        Self {
            cell_pointer: value.as_bytes(),
        }
    }
}

impl From<&DaoActionOutPoint> for CellPointerKey {
    fn from(value: &DaoActionOutPoint) -> Self {
        Self {
            cell_pointer: value.as_bytes(),
        }
    }
}

impl PartialOrd for CellPointerKey {
    fn partial_cmp(&self, other: &Self) -> Option<cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for CellPointerKey {
    fn cmp(&self, other: &Self) -> cmp::Ordering {
        self.cell_pointer.cmp(&other.cell_pointer)
    }
}

impl From<Address> for AccountingKey {
    fn from(value: Address) -> Self {
        Self {
            address: value.as_bytes(),
        }
    }
}

impl PartialOrd for AccountingKey {
    fn partial_cmp(&self, other: &Self) -> Option<cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for AccountingKey {
    fn cmp(&self, other: &Self) -> cmp::Ordering {
        self.address.cmp(&other.address)
    }
}
