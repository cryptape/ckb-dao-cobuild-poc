//! Derive dao action from tx.
use alloc::collections::BTreeMap;
use ckb_dao_cobuild_schemas::{Claim, DaoActionData, Deposit, Withdraw};
use ckb_std::{
    ckb_constants::Source,
    ckb_types::{packed, prelude::*},
    error::SysError,
    high_level::{
        load_cell, load_cell_occupied_capacity, load_header, load_input_out_point,
        load_witness_args, QueryIter,
    },
    since::EpochNumberWithFraction,
};

use crate::{
    constants::DAO_TYPE_SCRIPT,
    dao::is_deposit_cell,
    error::Error,
    error_code::ErrorCode,
    keys::{ClaimKey, DepositKey, WithdrawKey},
    trace_error,
};

#[derive(Debug)]
pub struct WithdrawValue {
    index: usize,
    input_cell_output: packed::CellOutput,
}

pub type ClaimValue = WithdrawValue;

#[derive(Default, Debug)]
pub struct DerivedDaoActionData {
    deposits: BTreeMap<DepositKey, usize>,
    withdraws: BTreeMap<WithdrawKey, WithdrawValue>,
    claims: BTreeMap<ClaimKey, ClaimValue>,
}

fn load_header_from_witness(witness: &[u8]) -> Result<packed::RawHeader, Error> {
    if witness.len() != 8 {
        return Err(trace_error!(
            ErrorCode::InvalidHeaderDepIndex,
            "expect witness len 8, got {}",
            witness.len()
        ));
    }

    let mut index_buf = [0u8; 8];
    index_buf.copy_from_slice(witness);
    let index = u64::from_le_bytes(index_buf);

    load_header(index as usize, Source::HeaderDep)
        .map(|h| h.raw())
        .map_err(|err| {
            trace_error!(
                ErrorCode::InvalidHeaderDepIndex,
                "failed to load header dep at {}: {:?}",
                index,
                err
            )
        })
}

fn decode_ar(dao: &[u8]) -> u64 {
    let mut ar_buf = [0u8; 8];
    ar_buf.copy_from_slice(&dao[8..16]);
    u64::from_le_bytes(ar_buf)
}

const DAO_CYCLE: u64 = 180;
// 4 hours
const ESITMATED_EPOCH_DURATION: u64 = 4 * 60 * 60 * 1000;

// Assume that one epoch lasts 4 hours.
//
// The fraction part are converted to milliseconds by truncating the decimal digits.
fn compute_waiting_milliseconds(
    deposit_header: &packed::RawHeader,
    withdraw_header: &packed::RawHeader,
) -> packed::Uint64 {
    let from_epoch = EpochNumberWithFraction::from_full_value(deposit_header.epoch().unpack());
    let to_epoch = EpochNumberWithFraction::from_full_value(withdraw_header.epoch().unpack());

    let from_epoch_passed_duration =
        from_epoch.index() * ESITMATED_EPOCH_DURATION / from_epoch.length();
    let to_epoch_passed_duration = to_epoch.index() * ESITMATED_EPOCH_DURATION / to_epoch.length();

    // find next cycle
    let remaining_epochs_draft = DAO_CYCLE - (to_epoch.number() - from_epoch.number()) % DAO_CYCLE;
    let remaining_epochs = if remaining_epochs_draft == DAO_CYCLE
        && to_epoch.number() > from_epoch.number()
        && from_epoch_passed_duration >= to_epoch_passed_duration
    {
        0
    } else {
        remaining_epochs_draft
    };

    (remaining_epochs * ESITMATED_EPOCH_DURATION + from_epoch_passed_duration
        - to_epoch_passed_duration)
        .pack()
}

fn compute_componsation_amount(
    counted_capacity: u64,
    deposit_header: &packed::RawHeader,
    withdraw_header: &packed::RawHeader,
) -> packed::Uint64 {
    let deposit_ar = decode_ar(deposit_header.dao().as_slice()) as u128;
    let withdraw_ar = decode_ar(withdraw_header.dao().as_slice()) as u128;

    (((counted_capacity as u128) * withdraw_ar / deposit_ar) as u64 - counted_capacity).pack()
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

        #[allow(clippy::mutable_key_type)]
        let (withdraws, claims) = QueryIter::new(load_cell, Source::Input)
            .enumerate()
            .filter(|(_index, input_cell_output)| {
                input_cell_output.type_().as_slice() == DAO_TYPE_SCRIPT
            })
            .map(|(index, input_cell_output)| {
                (
                    load_input_out_point(index, Source::Input)
                        .expect("load input out_point")
                        .into(),
                    WithdrawValue {
                        index,
                        input_cell_output,
                    },
                )
            })
            .partition(|(_key, value)| is_deposit_cell(value.index, Source::Input));

        Self {
            deposits,
            withdraws,
            claims,
        }
    }

    /// Ensure all derived operations have been found in tx.
    pub fn complete(self) -> Result<(), Error> {
        if let Some(index) = self.deposits.into_values().next() {
            return Err(trace_error!(
                ErrorCode::NotCoverred,
                "deposit at output {} not coverred by dao action",
                index
            ));
        }
        if let Some(value) = self.withdraws.into_values().next() {
            return Err(trace_error!(
                ErrorCode::NotCoverred,
                "withdraw at input {} not coverred by dao action",
                value.index
            ));
        }
        if let Some(value) = self.claims.into_values().next() {
            return Err(trace_error!(
                ErrorCode::NotCoverred,
                "claim at input {} not coverred by dao action",
                value.index
            ));
        }

        Ok(())
    }

    pub fn verify(&mut self, dao_action_data: &DaoActionData) -> Result<(), Error> {
        for deposit in dao_action_data.deposits().into_iter() {
            self.verify_deposit(deposit)?;
        }
        for withdraw in dao_action_data.withdraws().into_iter() {
            self.verify_withdraw(withdraw)?;
        }
        for claim in dao_action_data.claims().into_iter() {
            self.verify_claim(claim)?;
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

    fn verify_withdraw(&mut self, withdraw: Withdraw) -> Result<(), Error> {
        match self.withdraws.remove(&((&withdraw.cell_pointer()).into())) {
            Some(WithdrawValue {
                index,
                input_cell_output,
            }) => {
                if input_cell_output.lock().as_slice() != withdraw.from().as_slice() {
                    return Err(trace_error!(
                        ErrorCode::NotMatched,
                        "expect withdraw from {}, got {}",
                        withdraw.from(),
                        input_cell_output.lock()
                    ));
                }

                let deposit_info = withdraw.deposit_info();
                if input_cell_output.capacity().as_slice() != deposit_info.amount().as_slice() {
                    return Err(trace_error!(
                        ErrorCode::NotMatched,
                        "expect withdraw amount {}, got {}",
                        deposit_info.amount(),
                        input_cell_output.capacity()
                    ));
                }

                let output_cell_output = load_cell(index, Source::Output)?;
                if output_cell_output.lock().as_slice() != withdraw.to().as_slice() {
                    return Err(trace_error!(
                        ErrorCode::NotMatched,
                        "expect withdraw to {}, got {}",
                        withdraw.to(),
                        output_cell_output.lock()
                    ));
                }

                let deposit_header = load_header(index, Source::Input)?.raw();
                if deposit_header.number().as_slice()
                    != deposit_info.deposit_block_number().as_slice()
                {
                    return Err(trace_error!(
                        ErrorCode::NotMatched,
                        "expect deposit block number {}, got {}",
                        deposit_info.deposit_block_number(),
                        deposit_header.number()
                    ));
                }
                if deposit_header.timestamp().as_slice()
                    != deposit_info.deposit_timestamp().as_slice()
                {
                    return Err(trace_error!(
                        ErrorCode::NotMatched,
                        "expect deposit block timestamp {}, got {}",
                        deposit_info.deposit_timestamp(),
                        deposit_header.timestamp()
                    ));
                }

                let witness_opt = match load_witness_args(index, Source::Input) {
                    Ok(witness_args) => witness_args.input_type().to_opt(),
                    Err(SysError::Encoding) => None,
                    Err(err) => {
                        return Err(trace_error!(
                            err,
                            "failed to load witness args at {}",
                            index
                        ))
                    }
                };
                match (withdraw.estimated_withdraw_info().to_opt(), witness_opt) {
                    (Some(estimated_withdraw_info), Some(witness)) => {
                        let estimated_withdraw_header =
                            load_header_from_witness(&witness.raw_data())?;

                        let withdraw_info = estimated_withdraw_info.withdraw_info();
                        if estimated_withdraw_header.number().unpack()
                            < deposit_header.number().unpack()
                        {
                            return Err(trace_error!(
                                ErrorCode::NotMatched,
                                "expect estimated withdraw block number >= {}, got {}",
                                deposit_header.number(),
                                estimated_withdraw_header.number()
                            ));
                        }
                        if estimated_withdraw_header.number().as_slice()
                            != withdraw_info.withdraw_block_number().as_slice()
                        {
                            return Err(trace_error!(
                                ErrorCode::NotMatched,
                                "expect estimated withdraw block number {}, got {}",
                                withdraw_info.withdraw_block_number(),
                                estimated_withdraw_header.number()
                            ));
                        }
                        if estimated_withdraw_header.timestamp().as_slice()
                            != withdraw_info.withdraw_timestamp().as_slice()
                        {
                            return Err(trace_error!(
                                ErrorCode::NotMatched,
                                "expect estimated withdraw block timestamp {}, got {}",
                                withdraw_info.withdraw_timestamp(),
                                estimated_withdraw_header.timestamp()
                            ));
                        }

                        let actual_waiting_milliseconds = compute_waiting_milliseconds(
                            &deposit_header,
                            &estimated_withdraw_header,
                        );
                        if actual_waiting_milliseconds.as_slice()
                            != estimated_withdraw_info.waiting_milliseconds().as_slice()
                        {
                            return Err(trace_error!(
                                ErrorCode::NotMatched,
                                "expect estimated withdraw waiting milliseconds {}, got {}",
                                estimated_withdraw_info.waiting_milliseconds(),
                                actual_waiting_milliseconds
                            ));
                        }
                        let counted_capacity = output_cell_output.capacity().unpack()
                            - load_cell_occupied_capacity(index, Source::Output)?;
                        let actual_componsation_amount = compute_componsation_amount(
                            counted_capacity,
                            &deposit_header,
                            &estimated_withdraw_header,
                        );
                        if actual_componsation_amount.as_slice()
                            != withdraw_info.componsation_amount().as_slice()
                        {
                            return Err(trace_error!(
                                ErrorCode::NotMatched,
                                "expect estimated withdraw componsation amount {}, got {}",
                                withdraw_info.componsation_amount(),
                                actual_componsation_amount
                            ));
                        }

                        Ok(())
                    }
                    (None, None) => Ok(()),
                    (Some(withdraw_info), None) => Err(trace_error!(
                        ErrorCode::NotMatched,
                        "expect estimated withdraw info {}, got no witness",
                        withdraw_info
                    )),
                    (None, Some(witness)) => Err(trace_error!(
                        ErrorCode::NotMatched,
                        "expect no estimated withdraw info, got witness {}",
                        witness
                    )),
                }
            }
            None => Err(trace_error!(
                ErrorCode::NotFound,
                "withdraw not found in tx: {}",
                withdraw
            )),
        }
    }

    fn verify_claim(&mut self, claim: Claim) -> Result<(), Error> {
        match self.claims.remove(&((&claim.cell_pointer()).into())) {
            Some(ClaimValue {
                index,
                input_cell_output,
            }) => {
                if input_cell_output.lock().as_slice() != claim.from().as_slice() {
                    return Err(trace_error!(
                        ErrorCode::NotMatched,
                        "expect claim from {}, got {}",
                        claim.from(),
                        input_cell_output.lock()
                    ));
                }

                let deposit_info = claim.deposit_info();
                if input_cell_output.capacity().as_slice() != deposit_info.amount().as_slice() {
                    return Err(trace_error!(
                        ErrorCode::NotMatched,
                        "expect claim amount {}, got {}",
                        deposit_info.amount(),
                        input_cell_output.capacity()
                    ));
                }

                let deposit_header = load_header_from_witness(
                    load_witness_args(index, Source::Input)
                        .map_err(|err| {
                            trace_error!(err, "failed to load witness args at {}", index)
                        })?
                        .input_type()
                        .to_opt()
                        .ok_or_else(|| {
                            trace_error!(
                                ErrorCode::InvalidHeaderDepIndex,
                                "invalid witness args input type at {}",
                                index
                            )
                        })?
                        .raw_data()
                        .as_ref(),
                )?;
                if deposit_header.number().as_slice()
                    != deposit_info.deposit_block_number().as_slice()
                {
                    return Err(trace_error!(
                        ErrorCode::NotMatched,
                        "expect deposit block number {}, got {}",
                        deposit_info.deposit_block_number(),
                        deposit_header.number()
                    ));
                }
                if deposit_header.timestamp().as_slice()
                    != deposit_info.deposit_timestamp().as_slice()
                {
                    return Err(trace_error!(
                        ErrorCode::NotMatched,
                        "expect deposit block timestamp {}, got {}",
                        deposit_info.deposit_timestamp(),
                        deposit_header.timestamp()
                    ));
                }

                let withdraw_header = load_header(index, Source::Input)?.raw();
                let withdraw_info = claim.withdraw_info();
                if withdraw_header.number().unpack() < deposit_header.number().unpack() {
                    return Err(trace_error!(
                        ErrorCode::NotMatched,
                        "expect withdraw block number >= {}, got {}",
                        deposit_header.number(),
                        withdraw_header.number()
                    ));
                }
                if withdraw_header.number().as_slice()
                    != withdraw_info.withdraw_block_number().as_slice()
                {
                    return Err(trace_error!(
                        ErrorCode::NotMatched,
                        "expect withdraw block number {}, got {}",
                        withdraw_info.withdraw_block_number(),
                        withdraw_header.number()
                    ));
                }
                if withdraw_header.timestamp().as_slice()
                    != withdraw_info.withdraw_timestamp().as_slice()
                {
                    return Err(trace_error!(
                        ErrorCode::NotMatched,
                        "expect withdraw block timestamp {}, got {}",
                        withdraw_info.withdraw_timestamp(),
                        withdraw_header.timestamp()
                    ));
                }

                let counted_capacity = input_cell_output.capacity().unpack()
                    - load_cell_occupied_capacity(index, Source::Input)?;
                let actual_componsation_amount = compute_componsation_amount(
                    counted_capacity,
                    &deposit_header,
                    &withdraw_header,
                );
                if actual_componsation_amount.as_slice()
                    != withdraw_info.componsation_amount().as_slice()
                {
                    return Err(trace_error!(
                        ErrorCode::NotMatched,
                        "expect withdraw componsation amount {}, got {}",
                        withdraw_info.componsation_amount(),
                        actual_componsation_amount
                    ));
                }

                Ok(())
            }
            None => Err(trace_error!(
                ErrorCode::NotFound,
                "claim not found in tx: {}",
                claim
            )),
        }
    }
}
