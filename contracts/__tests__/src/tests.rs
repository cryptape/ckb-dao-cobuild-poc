// Include your tests here
// See https://github.com/xxuejie/ckb-native-build-sample/blob/main/tests/src/tests.rs for examples

use crate::*;
use ckb_dao_cobuild_schemas::{Address, DaoActionData};

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
