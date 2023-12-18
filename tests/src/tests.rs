use super::*;
use ckb_testtool::ckb_types::{bytes::Bytes, core::TransactionBuilder, packed, prelude::*};
use ckb_testtool::context::Context;

include!("../../contracts/joyid-cobuild-poc/src/error_include.rs");

const MAX_CYCLES: u64 = 120_000_000;

fn deploy_joyid_cobuild_poc(context: &mut Context) -> packed::OutPoint {
    let code = Loader::default().load_binary("joyid-cobuild-poc");
    context.deploy_cell(code)
}

#[test]
fn test_witness_layout_error() {
    // deploy contract
    let mut context = Context::default();
    let joyid_cobuild_poc_out_point = deploy_joyid_cobuild_poc(&mut context);

    // prepare scripts
    let lock_script = context
        .build_script(&joyid_cobuild_poc_out_point, Bytes::from(vec![]))
        .expect("script");

    // prepare cells
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
    let outputs = vec![
        packed::CellOutput::new_builder()
            .capacity(500u64.pack())
            .lock(lock_script.clone())
            .build(),
        packed::CellOutput::new_builder()
            .capacity(500u64.pack())
            .lock(lock_script)
            .build(),
    ];

    let outputs_data = vec![Bytes::new(); 2];

    // build transaction
    let tx = TransactionBuilder::default()
        .input(input)
        .outputs(outputs)
        .outputs_data(outputs_data.pack())
        .build();
    let tx = context.complete_tx(tx);

    // run
    let result = context.verify_tx(&tx, MAX_CYCLES);
    assert_script_error(result.err(), Error::WitnessLayoutError as i8);
}
