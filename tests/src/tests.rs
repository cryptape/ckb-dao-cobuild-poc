use super::*;
use base64ct::{Base64UrlUnpadded, Encoding as _};
use ckb_testtool::{
    ckb_types::{bytes::Bytes, core::TransactionBuilder, packed},
    context::Context,
};
use hex_literal::hex;
use p256::ecdsa::Signature;

include!("../../contracts/joyid-cobuild-poc/src/error_include.rs");

const MAX_CYCLES: u64 = 120_000_000;

const PREVIOUS_TX_HASH: [u8; 32] = [1u8; 32];
const CODE_CELL_INDEX: u32 = 1;
const TEST_CELL_INDEX: u32 = 2;

// Determined lock script code cell to make the tx hash fixed
fn build_code_cell(context: &mut Context) -> packed::OutPoint {
    let binary = Loader::default().load_joyid_cobuild_poc_binary();
    let out_point = packed::OutPoint::new_builder()
        .tx_hash(PREVIOUS_TX_HASH.pack())
        .index(CODE_CELL_INDEX.pack())
        .build();
    let code_cell = packed::CellOutput::new_builder()
        .capacity(50_0000_0000_0000.pack())
        .type_(
            Some(
                packed::Script::new_builder()
                    .code_hash([0u8; 32].pack())
                    .build(),
            )
            .pack(),
        )
        .build();
    context.create_cell_with_out_point(out_point.clone(), code_cell, binary);

    out_point
}

// the test cell used in the 1-in-1-out transaction
fn build_test_cell(context: &mut Context, lock_args: Bytes) -> packed::CellOutput {
    let code_out_point = build_code_cell(context);

    let lock_script = context
        .build_script(&code_out_point, lock_args)
        .expect("build script");
    packed::CellOutput::new_builder()
        .capacity(1000_0000_0000u64.pack())
        .lock(lock_script)
        .build()
}

fn base_transaction_builder(context: &mut Context, lock_args: Bytes) -> TransactionBuilder {
    let cell = build_test_cell(context, lock_args);

    // Determined out point to make the tx hash fixed
    let out_point = packed::OutPoint::new_builder()
        .tx_hash(PREVIOUS_TX_HASH.pack())
        .index(TEST_CELL_INDEX.pack())
        .build();
    context.create_cell_with_out_point(out_point.clone(), cell.clone(), Bytes::new());
    let input = packed::CellInput::new_builder()
        .previous_output(out_point)
        .build();

    TransactionBuilder::default()
        .input(input)
        .output(cell)
        .output_data(Bytes::new().pack())
}

#[test]
fn test_witness_layout_error() {
    let mut context = Context::default();
    let tx = base_transaction_builder(&mut context, Bytes::new()).build();
    let tx = context.complete_tx(tx);

    let result = context.verify_tx(&tx, MAX_CYCLES);
    assert_script_err_code(result, Error::WitnessLayoutError as i8);
}

#[test]
fn test_witness_args_layout() {
    // This is the response from @joyid/ckb signChallenge by signing the challenge
    // eb97071b64e5ce0ebd3f46e63764920ae5f7b2093c90301d6bddfaf6ef50e91e
    // {
    //   "signature": "MEUCIQCnxv2O4YZpIo5XATUokJA3t87sopvX0EwWMsy13Z1rogIgSHBHtyMYP4_vh5i4Pof5CKaL7RiGAGfGjwiBHyR0_vg",
    //   "message": "K4sF4fAwPvuJj-TW3mARmMenuGSrvmohxzsueH4YfFIFAAAAAHsidHlwZSI6IndlYmF1dGhuLmdldCIsImNoYWxsZW5nZSI6IlpXSTVOekEzTVdJMk5HVTFZMlV3WldKa00yWTBObVUyTXpjMk5Ea3lNR0ZsTldZM1lqSXdPVE5qT1RBek1ERmtObUprWkdaaFpqWmxaalV3WlRreFpRIiwib3JpZ2luIjoiaHR0cHM6Ly90ZXN0bmV0LmpveWlkLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
    //   "challenge": "eb97071b64e5ce0ebd3f46e63764920ae5f7b2093c90301d6bddfaf6ef50e91e",
    //   "alg": -7,
    //   "pubkey": "3538dfd53ad93d2e0a6e7f470295dcd71057d825e1f87229e5afe2a906aa7cfc099fdfa04442dac33548b6988af8af58d2052529088f7b73ef00800f7fbcddb3",
    //   "keyType": "main_key"
    // }
    let pubkey = hex!("3538dfd53ad93d2e0a6e7f470295dcd71057d825e1f87229e5afe2a906aa7cfc099fdfa04442dac33548b6988af8af58d2052529088f7b73ef00800f7fbcddb3");
    let signature = Signature::from_der(&Base64UrlUnpadded::decode_vec("MEUCIQCnxv2O4YZpIo5XATUokJA3t87sopvX0EwWMsy13Z1rogIgSHBHtyMYP4_vh5i4Pof5CKaL7RiGAGfGjwiBHyR0_vg").expect("decode signature")).expect("decode signature").to_bytes();
    let message = Base64UrlUnpadded::decode_vec("K4sF4fAwPvuJj-TW3mARmMenuGSrvmohxzsueH4YfFIFAAAAAHsidHlwZSI6IndlYmF1dGhuLmdldCIsImNoYWxsZW5nZSI6IlpXSTVOekEzTVdJMk5HVTFZMlV3WldKa00yWTBObVUyTXpjMk5Ea3lNR0ZsTldZM1lqSXdPVE5qT1RBek1ERmtObUprWkdaaFpqWmxaalV3WlRreFpRIiwib3JpZ2luIjoiaHR0cHM6Ly90ZXN0bmV0LmpveWlkLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0").expect("decode message");
    let mut seal = Vec::with_capacity(pubkey.len() + signature.len() + message.len());
    seal.extend_from_slice(&pubkey);
    seal.extend_from_slice(&signature);
    seal.extend_from_slice(&message);

    // ckb-cli util blake2b --binary-hex 0x3538dfd53ad93d2e0a6e7f470295dcd71057d825e1f87229e5afe2a906aa7cfc099fdfa04442dac33548b6988af8af58d2052529088f7b73ef00800f7fbcddb3 --prefix-160
    // 0xac4fb598d2e089e62406707d1aee4a27219515cc
    let pubkey_hash = hex!("ac4fb598d2e089e62406707d1aee4a27219515cc");

    let mut context = Context::default();
    let witness = packed::WitnessArgs::new_builder()
        .lock(Some(Bytes::from(seal)).pack())
        .build()
        .as_bytes();
    let tx = base_transaction_builder(&mut context, Bytes::from(pubkey_hash.to_vec()))
        .witness(witness.pack())
        .build();
    let tx = context.complete_tx(tx);

    let sighash = compute_sighash(&tx, vec![0]);
    println!("sighash: {:?}", sighash);
    print!("sighash: ");
    for char in sighash {
        print!("{:02x}", char);
    }
    println!();
    // => eb97071b64e5ce0ebd3f46e63764920ae5f7b2093c90301d6bddfaf6ef50e91e

    // run
    let result = context.verify_tx(&tx, MAX_CYCLES);
    assert_script_ok(result);
}
