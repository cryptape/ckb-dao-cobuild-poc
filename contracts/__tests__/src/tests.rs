// Include your tests here
// See https://github.com/xxuejie/ckb-native-build-sample/blob/main/tests/src/tests.rs for examples

use crate::Loader;
use ckb_testtool::{
    ckb_types::{bytes::Bytes, core::TransactionBuilder, packed, prelude::*},
    context::Context,
};

include!("../../dao-action-verifier/src/error_code.rs");

const MAX_CYCLES: u64 = 10_000_000;

#[test]
fn test_fail() {
    let loader = Loader::default();
    let mut context = Context::default();

    let bin = loader.load_binary("dao-action-verifier");
    let out_point = context.deploy_cell(bin);

    let lock_script = context
        .build_script(&out_point, Default::default())
        .expect("script");

    let input_out_point = context.create_cell(
        packed::CellOutput::new_builder()
            .capacity(1000u64.pack())
            .lock(lock_script.clone())
            .build(),
        Bytes::new(),
    );
    let input = packed::CellInput::new_builder()
        .previous_output(input_out_point)
        .build();

    let outputs = vec![packed::CellOutput::new_builder()
        .capacity(1000u64.pack())
        .lock(lock_script.clone())
        .build()];

    let outputs_data = vec![Bytes::new()];

    let tx = TransactionBuilder::default()
        .input(input)
        .outputs(outputs)
        .outputs_data(outputs_data.pack())
        .build();

    let tx = context.complete_tx(tx);

    let result = context.verify_tx(&tx, MAX_CYCLES);
    assert!(result.is_err());
}
