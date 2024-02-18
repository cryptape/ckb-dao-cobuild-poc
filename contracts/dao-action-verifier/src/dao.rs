use ckb_std::{ckb_constants::Source, high_level::load_cell_data};

use crate::constants::DAO_DEPOSIT_DATA;

pub fn is_deposit_cell(index: usize, source: Source) -> bool {
    load_cell_data(index, source)
        .map(|data| data.as_ref() == DAO_DEPOSIT_DATA)
        .unwrap_or(false)
}
