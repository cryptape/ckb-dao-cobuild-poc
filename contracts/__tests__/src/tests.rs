// Include your tests here
// See https://github.com/xxuejie/ckb-native-build-sample/blob/main/tests/src/tests.rs for examples

use crate::*;
use ckb_dao_cobuild_schemas::{
    Address, DaoActionData, DepositInfo, EstimatedWithdrawInfo, EstimatedWithdrawInfoOpt, OutPoint,
    WithdrawInfo,
};
use ckb_testtool::ckb_types::core::{EpochNumberWithFraction, HeaderBuilder};

const MAX_CYCLES: u64 = 10_000_000;

#[test]
fn test_null_dao_data() {
    let mut spec = DefaultTxSpec::new();

    let tx = build_tx(&mut spec);
    verify_and_dump_failed_tx(&spec.context, &tx, MAX_CYCLES).expect("pass");
}

#[test]
fn test_invalid_dao_data() {
    let mut spec = CustomTxSpec::default();
    let witness = spec.inner.pack_dao_data(Bytes::new());
    spec.on_new_tx_builder(move |b| b.witness(witness.clone().pack()));

    let tx = build_tx(&mut spec);
    assert_tx_error(
        &spec.inner.context,
        &tx,
        ErrorCode::InvalidActionDataSchema,
        MAX_CYCLES,
    );
}

#[test]
fn test_empty_dao_ops() {
    let mut spec = CustomTxSpec::default();
    let witness = spec
        .inner
        .pack_dao_data_vec(vec![DaoActionData::default().as_bytes()]);
    // unset deposit
    spec.on_new_output_spec(|cell| CellSpec {
        output: cell.output.type_(packed::ScriptOpt::default()),
        ..cell
    });
    spec.on_new_tx_builder(move |b| b.witness(witness.clone().pack()));

    let tx = build_tx(&mut spec);
    verify_and_dump_failed_tx(&spec.inner.context, &tx, MAX_CYCLES).expect("pass");
}

#[test]
fn test_multiple_dao_actions() {
    let mut spec = CustomTxSpec::default();
    let witness = spec.inner.pack_dao_data_vec(vec![
        DaoActionData::default().as_bytes(),
        DaoActionData::default().as_bytes(),
    ]);
    // unset deposit
    spec.on_new_output_spec(|cell| CellSpec {
        output: cell.output.type_(packed::ScriptOpt::default()),
        ..cell
    });
    spec.on_new_tx_builder(move |b| b.witness(witness.clone().pack()));

    let tx = build_tx(&mut spec);
    verify_and_dump_failed_tx(&spec.inner.context, &tx, MAX_CYCLES).expect("pass");
}

#[test]
fn test_dao_deposit_single() {
    let mut spec = CustomTxSpec::default();
    let witness = spec.inner.pack_dao_operations(
        vec![Deposit::new_builder()
            .from(Address::new_unchecked(
                spec.inner.alice_lock_script.as_bytes(),
            ))
            .to(Address::new_unchecked(
                spec.inner.alice_lock_script.as_bytes(),
            ))
            .amount(pack_capacity(DEFAULT_CAPACITY))
            .build()],
        vec![],
        vec![],
    );
    spec.on_new_tx_builder(move |b| b.witness(witness.clone().pack()));

    let tx = build_tx(&mut spec);
    verify_and_dump_failed_tx(&spec.inner.context, &tx, MAX_CYCLES).expect("pass");
}

#[test]
fn test_dao_deposit_not_found() {
    let mut spec = CustomTxSpec::default();
    let witness = spec.inner.pack_dao_operations(
        vec![Deposit::new_builder()
            .from(Address::new_unchecked(
                spec.inner.alice_lock_script.as_bytes(),
            ))
            .to(Address::new_unchecked(
                spec.inner.alice_lock_script.as_bytes(),
            ))
            .build()],
        vec![],
        vec![],
    );
    spec.on_new_tx_builder(move |b| b.witness(witness.clone().pack()));

    let tx = build_tx(&mut spec);
    assert_tx_error(&spec.inner.context, &tx, ErrorCode::NotFound, MAX_CYCLES);
}

#[test]
fn test_dao_deposit_not_coverred() {
    let mut spec = CustomTxSpec::default();
    let witness = spec.inner.pack_dao_operations(vec![], vec![], vec![]);
    spec.on_new_tx_builder(move |b| b.witness(witness.clone().pack()));

    let tx = build_tx(&mut spec);
    assert_tx_error(&spec.inner.context, &tx, ErrorCode::NotCoverred, MAX_CYCLES);
}

#[test]
fn test_dao_withdraw_not_found() {
    let mut spec = create_withdraw_spec(new_header_builder(1, 100).build(), None, |spec| {
        Withdraw::new_builder()
            .cell_pointer(OutPoint::new_unchecked(non_existing_out_point().as_bytes()))
            .from(Address::new_unchecked(
                spec.inner.alice_lock_script.as_bytes(),
            ))
            .to(Address::new_unchecked(
                spec.inner.alice_lock_script.as_bytes(),
            ))
            .deposit_info(
                DepositInfo::new_builder()
                    .amount(pack_capacity(DEFAULT_CAPACITY))
                    .build(),
            )
            .build()
    });

    let tx = build_tx(&mut spec);
    assert_tx_error(&spec.inner.context, &tx, ErrorCode::NotFound, MAX_CYCLES);
}

#[test]
fn test_dao_withdraw_not_coverred() {
    let mut spec = create_withdraw_spec(new_header_builder(1, 100).build(), None, |spec| {
        Withdraw::new_builder()
            .cell_pointer(OutPoint::new_unchecked(non_existing_out_point().as_bytes()))
            .from(Address::new_unchecked(
                spec.inner.alice_lock_script.as_bytes(),
            ))
            .to(Address::new_unchecked(
                spec.inner.alice_lock_script.as_bytes(),
            ))
            .deposit_info(
                DepositInfo::new_builder()
                    .amount(pack_capacity(DEFAULT_CAPACITY))
                    .build(),
            )
            .build()
    });

    let witnesses = vec![
        Bytes::new(),
        Bytes::new(),
        spec.inner
            .pack_dao_data(DaoActionData::default().as_bytes()),
    ];
    spec.on_new_tx_builder(move |b| b.set_witnesses(vec![]).witnesses(witnesses.clone().pack()));

    let tx = build_tx(&mut spec);
    assert_tx_error(&spec.inner.context, &tx, ErrorCode::NotCoverred, MAX_CYCLES);
}

#[test]
fn test_dao_withdraw_from_not_match() {
    let mut spec = create_withdraw_spec(new_header_builder(1, 100).build(), None, |spec| {
        Withdraw::new_builder()
            .cell_pointer(OutPoint::new_unchecked(
                spec.inner.dao_input_out_point.as_bytes(),
            ))
            .build()
    });

    let tx = build_tx(&mut spec);
    assert_tx_error(&spec.inner.context, &tx, ErrorCode::NotMatched, MAX_CYCLES);
}

#[test]
fn test_dao_withdraw_amount_not_match() {
    let mut spec = create_withdraw_spec(new_header_builder(1, 100).build(), None, |spec| {
        Withdraw::new_builder()
            .cell_pointer(OutPoint::new_unchecked(
                spec.inner.dao_input_out_point.as_bytes(),
            ))
            .from(Address::new_unchecked(
                spec.inner.alice_lock_script.as_bytes(),
            ))
            .build()
    });

    let tx = build_tx(&mut spec);
    assert_tx_error(&spec.inner.context, &tx, ErrorCode::NotMatched, MAX_CYCLES);
}

#[test]
fn test_dao_withdraw_to_not_match() {
    let mut spec = create_withdraw_spec(new_header_builder(1, 100).build(), None, |spec| {
        Withdraw::new_builder()
            .cell_pointer(OutPoint::new_unchecked(
                spec.inner.dao_input_out_point.as_bytes(),
            ))
            .from(Address::new_unchecked(
                spec.inner.alice_lock_script.as_bytes(),
            ))
            .deposit_info(
                DepositInfo::new_builder()
                    .amount(pack_capacity(DEFAULT_CAPACITY))
                    .build(),
            )
            .build()
    });

    let tx = build_tx(&mut spec);
    assert_tx_error(&spec.inner.context, &tx, ErrorCode::NotMatched, MAX_CYCLES);
}

#[test]
fn test_dao_withdraw_deposit_block_number_not_match() {
    let mut spec = create_withdraw_spec(new_header_builder(1, 100).build(), None, |spec| {
        Withdraw::new_builder()
            .cell_pointer(OutPoint::new_unchecked(
                spec.inner.dao_input_out_point.as_bytes(),
            ))
            .from(Address::new_unchecked(
                spec.inner.alice_lock_script.as_bytes(),
            ))
            .to(Address::new_unchecked(
                spec.inner.alice_lock_script.as_bytes(),
            ))
            .deposit_info(
                DepositInfo::new_builder()
                    .amount(pack_capacity(DEFAULT_CAPACITY))
                    .build(),
            )
            .build()
    });

    let tx = build_tx(&mut spec);
    assert_tx_error(&spec.inner.context, &tx, ErrorCode::NotMatched, MAX_CYCLES);
}

#[test]
fn test_dao_withdraw_deposit_timestamp_not_match() {
    let mut spec = create_withdraw_spec(
        new_header_builder(1, 100).timestamp(1.pack()).build(),
        None,
        |spec| {
            Withdraw::new_builder()
                .cell_pointer(OutPoint::new_unchecked(
                    spec.inner.dao_input_out_point.as_bytes(),
                ))
                .from(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .to(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .deposit_info(
                    DepositInfo::new_builder()
                        .deposit_block_number(pack_uint64(1))
                        .amount(pack_capacity(DEFAULT_CAPACITY))
                        .build(),
                )
                .build()
        },
    );

    let tx = build_tx(&mut spec);
    assert_tx_error(&spec.inner.context, &tx, ErrorCode::NotMatched, MAX_CYCLES);
}

#[test]
fn test_dao_withdraw_estimated_withdraw_header_not_found() {
    let mut spec = create_withdraw_spec(new_header_builder(1, 100).build(), None, |spec| {
        Withdraw::new_builder()
            .cell_pointer(OutPoint::new_unchecked(
                spec.inner.dao_input_out_point.as_bytes(),
            ))
            .from(Address::new_unchecked(
                spec.inner.alice_lock_script.as_bytes(),
            ))
            .to(Address::new_unchecked(
                spec.inner.alice_lock_script.as_bytes(),
            ))
            .deposit_info(
                DepositInfo::new_builder()
                    .deposit_block_number(pack_uint64(1))
                    .amount(pack_capacity(DEFAULT_CAPACITY))
                    .build(),
            )
            .estimated_withdraw_info(
                EstimatedWithdrawInfoOpt::new_builder()
                    .set(Some(EstimatedWithdrawInfo::new_builder().build()))
                    .build(),
            )
            .build()
    });

    let tx = build_tx(&mut spec);
    assert_tx_error(&spec.inner.context, &tx, ErrorCode::NotMatched, MAX_CYCLES);
}

#[test]
fn test_dao_withdraw_estimated_withdraw_header_not_coverred() {
    let mut spec = create_withdraw_spec(
        new_header_builder(1, 100).build(),
        Some(new_header_builder(2, 100).build()),
        |spec| {
            Withdraw::new_builder()
                .cell_pointer(OutPoint::new_unchecked(
                    spec.inner.dao_input_out_point.as_bytes(),
                ))
                .from(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .to(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .deposit_info(
                    DepositInfo::new_builder()
                        .deposit_block_number(pack_uint64(1))
                        .amount(pack_capacity(DEFAULT_CAPACITY))
                        .build(),
                )
                .build()
        },
    );

    let tx = build_tx(&mut spec);
    assert_tx_error(&spec.inner.context, &tx, ErrorCode::NotMatched, MAX_CYCLES);
}

#[test]
fn test_dao_withdraw_without_estimated_withdraw_info() {
    let mut spec = create_withdraw_spec(new_header_builder(1, 100).build(), None, |spec| {
        Withdraw::new_builder()
            .cell_pointer(OutPoint::new_unchecked(
                spec.inner.dao_input_out_point.as_bytes(),
            ))
            .from(Address::new_unchecked(
                spec.inner.alice_lock_script.as_bytes(),
            ))
            .to(Address::new_unchecked(
                spec.inner.alice_lock_script.as_bytes(),
            ))
            .deposit_info(
                DepositInfo::new_builder()
                    .deposit_block_number(pack_uint64(1))
                    .amount(pack_capacity(DEFAULT_CAPACITY))
                    .build(),
            )
            .build()
    });

    let tx = build_tx(&mut spec);
    verify_and_dump_failed_tx(&spec.inner.context, &tx, MAX_CYCLES).expect("pass");
}

#[test]
fn test_dao_withdraw_larger_estimated_withdraw_block_number() {
    let mut spec = create_withdraw_spec(
        new_header_builder(1, 100).build(),
        Some(new_header_builder(1, 100).build()),
        |spec| {
            Withdraw::new_builder()
                .cell_pointer(OutPoint::new_unchecked(
                    spec.inner.dao_input_out_point.as_bytes(),
                ))
                .from(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .to(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .deposit_info(
                    DepositInfo::new_builder()
                        .deposit_block_number(pack_uint64(1))
                        .amount(pack_capacity(DEFAULT_CAPACITY))
                        .build(),
                )
                .estimated_withdraw_info(
                    EstimatedWithdrawInfoOpt::new_builder()
                        .set(Some(EstimatedWithdrawInfo::new_builder().build()))
                        .build(),
                )
                .build()
        },
    );

    let tx = build_tx(&mut spec);
    assert_tx_error(&spec.inner.context, &tx, ErrorCode::NotMatched, MAX_CYCLES);
}

#[test]
fn test_dao_withdraw_estimated_withdraw_block_number_not_matched() {
    let mut spec = create_withdraw_spec(
        new_header_builder(1, 100).build(),
        Some(new_header_builder(2, 100).build()),
        |spec| {
            Withdraw::new_builder()
                .cell_pointer(OutPoint::new_unchecked(
                    spec.inner.dao_input_out_point.as_bytes(),
                ))
                .from(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .to(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .deposit_info(
                    DepositInfo::new_builder()
                        .deposit_block_number(pack_uint64(1))
                        .amount(pack_capacity(DEFAULT_CAPACITY))
                        .build(),
                )
                .estimated_withdraw_info(
                    EstimatedWithdrawInfoOpt::new_builder()
                        .set(Some(EstimatedWithdrawInfo::new_builder().build()))
                        .build(),
                )
                .build()
        },
    );

    let tx = build_tx(&mut spec);
    assert_tx_error(&spec.inner.context, &tx, ErrorCode::NotMatched, MAX_CYCLES);
}

#[test]
fn test_dao_withdraw_estimated_withdraw_timestamp_not_matched() {
    let mut spec = create_withdraw_spec(
        new_header_builder(1, 100).build(),
        Some(new_header_builder(2, 100).timestamp(1.pack()).build()),
        |spec| {
            Withdraw::new_builder()
                .cell_pointer(OutPoint::new_unchecked(
                    spec.inner.dao_input_out_point.as_bytes(),
                ))
                .from(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .to(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .deposit_info(
                    DepositInfo::new_builder()
                        .deposit_block_number(pack_uint64(1))
                        .amount(pack_capacity(DEFAULT_CAPACITY))
                        .build(),
                )
                .estimated_withdraw_info(
                    EstimatedWithdrawInfoOpt::new_builder()
                        .set(Some(
                            EstimatedWithdrawInfo::new_builder()
                                .withdraw_info(
                                    WithdrawInfo::new_builder()
                                        .withdraw_block_number(pack_uint64(2))
                                        .build(),
                                )
                                .build(),
                        ))
                        .build(),
                )
                .build()
        },
    );

    let tx = build_tx(&mut spec);
    assert_tx_error(&spec.inner.context, &tx, ErrorCode::NotMatched, MAX_CYCLES);
}

#[test]
fn test_dao_withdraw_estimated_waiting_milliseconds_not_matched() {
    let mut spec = create_withdraw_spec(
        new_header_builder(1, 100).build(),
        Some(new_header_builder(2, 100).build()),
        |spec| {
            Withdraw::new_builder()
                .cell_pointer(OutPoint::new_unchecked(
                    spec.inner.dao_input_out_point.as_bytes(),
                ))
                .from(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .to(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .deposit_info(
                    DepositInfo::new_builder()
                        .deposit_block_number(pack_uint64(1))
                        .amount(pack_capacity(DEFAULT_CAPACITY))
                        .build(),
                )
                .estimated_withdraw_info(
                    EstimatedWithdrawInfoOpt::new_builder()
                        .set(Some(
                            EstimatedWithdrawInfo::new_builder()
                                .withdraw_info(
                                    WithdrawInfo::new_builder()
                                        .withdraw_block_number(pack_uint64(2))
                                        .build(),
                                )
                                .build(),
                        ))
                        .build(),
                )
                .build()
        },
    );

    let tx = build_tx(&mut spec);
    assert_tx_error(&spec.inner.context, &tx, ErrorCode::NotMatched, MAX_CYCLES);
}

#[test]
fn test_dao_withdraw_estimated_componsation_amount_not_matched() {
    let mut spec = create_withdraw_spec(
        new_header_builder(1, 100).dao(pack_ar(100)).build(),
        Some(new_header_builder(2, 100).dao(pack_ar(110)).build()),
        |spec| {
            Withdraw::new_builder()
                .cell_pointer(OutPoint::new_unchecked(
                    spec.inner.dao_input_out_point.as_bytes(),
                ))
                .from(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .to(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .deposit_info(
                    DepositInfo::new_builder()
                        .deposit_block_number(pack_uint64(1))
                        .amount(pack_capacity(DEFAULT_CAPACITY))
                        .build(),
                )
                .estimated_withdraw_info(
                    EstimatedWithdrawInfoOpt::new_builder()
                        .set(Some(
                            EstimatedWithdrawInfo::new_builder()
                                .waiting_milliseconds(pack_uint64(
                                    DAO_CYCLE * ESITMATED_EPOCH_DURATION
                                        - ESITMATED_EPOCH_DURATION / 100,
                                ))
                                .withdraw_info(
                                    WithdrawInfo::new_builder()
                                        .withdraw_block_number(pack_uint64(2))
                                        .build(),
                                )
                                .build(),
                        ))
                        .build(),
                )
                .build()
        },
    );

    let tx = build_tx(&mut spec);
    assert_tx_error(&spec.inner.context, &tx, ErrorCode::NotMatched, MAX_CYCLES);
}

#[test]
fn test_dao_withdraw_with_estimated_withdraw_info() {
    let mut spec = create_withdraw_spec(
        new_header_builder(1, 100).dao(pack_ar(100)).build(),
        Some(new_header_builder(2, 100).dao(pack_ar(110)).build()),
        |spec| {
            Withdraw::new_builder()
                .cell_pointer(OutPoint::new_unchecked(
                    spec.inner.dao_input_out_point.as_bytes(),
                ))
                .from(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .to(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .deposit_info(
                    DepositInfo::new_builder()
                        .deposit_block_number(pack_uint64(1))
                        .amount(pack_capacity(DEFAULT_CAPACITY))
                        .build(),
                )
                .estimated_withdraw_info(
                    EstimatedWithdrawInfoOpt::new_builder()
                        .set(Some(
                            EstimatedWithdrawInfo::new_builder()
                                .waiting_milliseconds(pack_uint64(
                                    DAO_CYCLE * ESITMATED_EPOCH_DURATION
                                        - ESITMATED_EPOCH_DURATION / 100,
                                ))
                                .withdraw_info(
                                    WithdrawInfo::new_builder()
                                        .withdraw_block_number(pack_uint64(2))
                                        .componsation_amount(pack_capacity(
                                            (DEFAULT_CAPACITY - DAO_INPUT_OCCUPIED_CAPACITY) / 10,
                                        ))
                                        .build(),
                                )
                                .build(),
                        ))
                        .build(),
                )
                .build()
        },
    );

    let tx = build_tx(&mut spec);
    verify_and_dump_failed_tx(&spec.inner.context, &tx, MAX_CYCLES).expect("pass");
}

fn case_withdraw_waiting_milliseconds(
    from: EpochNumberWithFraction,
    to: EpochNumberWithFraction,
    expected: u64,
) {
    let from_block_number = from.number() * from.length() + from.index();
    let to_block_number = to.number() * to.length() + to.index();

    let mut spec = create_withdraw_spec(
        HeaderBuilder::default()
            .number(from_block_number.pack())
            .epoch(from.pack())
            .dao(pack_ar(100))
            .build(),
        Some(
            HeaderBuilder::default()
                .number(to_block_number.pack())
                .epoch(to.pack())
                .dao(pack_ar(110))
                .build(),
        ),
        |spec| {
            Withdraw::new_builder()
                .cell_pointer(OutPoint::new_unchecked(
                    spec.inner.dao_input_out_point.as_bytes(),
                ))
                .from(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .to(Address::new_unchecked(
                    spec.inner.alice_lock_script.as_bytes(),
                ))
                .deposit_info(
                    DepositInfo::new_builder()
                        .deposit_block_number(pack_uint64(from_block_number))
                        .amount(pack_capacity(DEFAULT_CAPACITY))
                        .build(),
                )
                .estimated_withdraw_info(
                    EstimatedWithdrawInfoOpt::new_builder()
                        .set(Some(
                            EstimatedWithdrawInfo::new_builder()
                                .waiting_milliseconds(pack_uint64(expected))
                                .withdraw_info(
                                    WithdrawInfo::new_builder()
                                        .withdraw_block_number(pack_uint64(to_block_number))
                                        .componsation_amount(pack_capacity(
                                            (DEFAULT_CAPACITY - DAO_INPUT_OCCUPIED_CAPACITY) / 10,
                                        ))
                                        .build(),
                                )
                                .build(),
                        ))
                        .build(),
                )
                .build()
        },
    );

    let tx = build_tx(&mut spec);
    verify_and_dump_failed_tx(&spec.inner.context, &tx, MAX_CYCLES).expect("pass");
}

#[test]
fn test_withdraw_waiting_milliseconds_zero() {
    case_withdraw_waiting_milliseconds(
        EpochNumberWithFraction::new(0, 5, 10),
        EpochNumberWithFraction::new(180, 5, 10),
        0,
    );
}

#[test]
fn test_withdraw_waiting_milliseconds_boundary_cases() {
    case_withdraw_waiting_milliseconds(
        EpochNumberWithFraction::new(0, 5, 10),
        EpochNumberWithFraction::new(179, 5, 10),
        ESITMATED_EPOCH_DURATION,
    );
    case_withdraw_waiting_milliseconds(
        EpochNumberWithFraction::new(0, 5, 10),
        EpochNumberWithFraction::new(179, 9, 10),
        ESITMATED_EPOCH_DURATION * 6 / 10,
    );
    case_withdraw_waiting_milliseconds(
        EpochNumberWithFraction::new(0, 5, 10),
        EpochNumberWithFraction::new(180, 4, 10),
        ESITMATED_EPOCH_DURATION / 10,
    );
    case_withdraw_waiting_milliseconds(
        EpochNumberWithFraction::new(0, 5, 10),
        EpochNumberWithFraction::new(180, 6, 10),
        DAO_CYCLE * ESITMATED_EPOCH_DURATION - ESITMATED_EPOCH_DURATION / 10,
    );
}
