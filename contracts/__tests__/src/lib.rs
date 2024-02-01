use ckb_dao_cobuild_schemas::{
    Capacity, Claim, ClaimVec, DaoActionData, Deposit, DepositVec, Uint64 as DaoActionUint64,
    Withdraw, WithdrawVec,
};
use ckb_testtool::{
    builtin::ALWAYS_SUCCESS,
    ckb_error::Error,
    ckb_hash::blake2b_256,
    ckb_types::{
        bytes::Bytes,
        core::{
            Cycle, EpochNumberWithFraction, HeaderBuilder, HeaderView, TransactionBuilder,
            TransactionView,
        },
        packed,
        prelude::*,
    },
    context::{random_out_point, Context},
};
use ckb_transaction_cobuild::schemas::{
    basic::{Action, ActionVec, Message, SighashAll},
    top_level::{WitnessLayout, WitnessLayoutUnion},
};
use hex_literal::hex;
use std::{env, fs, path::PathBuf, str::FromStr};

include!("../../dao-action-verifier/src/error_code.rs");

#[cfg(test)]
mod tests;

// The exact same Loader code from capsule's template, except that
// now we use MODE as the environment variable
const TEST_ENV_VAR: &str = "MODE";

pub enum TestEnv {
    Debug,
    Release,
}

impl FromStr for TestEnv {
    type Err = &'static str;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "debug" => Ok(TestEnv::Debug),
            "release" => Ok(TestEnv::Release),
            _ => Err("no match"),
        }
    }
}

pub struct Loader(PathBuf);

impl Default for Loader {
    fn default() -> Self {
        let test_env = match env::var(TEST_ENV_VAR) {
            Ok(val) => val.parse().expect("test env"),
            Err(_) => TestEnv::Release,
        };
        Self::with_test_env(test_env)
    }
}

impl Loader {
    fn with_test_env(env: TestEnv) -> Self {
        let load_prefix = match env {
            TestEnv::Debug => "debug",
            TestEnv::Release => "release",
        };
        let mut base_path = match env::var("TOP") {
            Ok(val) => {
                let mut base_path: PathBuf = val.into();
                base_path.push("build");
                base_path
            }
            Err(_) => {
                let mut base_path = PathBuf::new();
                // cargo may use a different cwd when running tests, for example:
                // when running debug in vscode, it will use workspace root as cwd by default,
                // when running test by `cargo test`, it will use tests directory as cwd,
                // so we need a fallback path
                base_path.push("build");
                if !base_path.exists() {
                    base_path.pop();
                    base_path.push("..");
                    base_path.push("build");
                }
                base_path
            }
        };

        base_path.push(load_prefix);
        Loader(base_path)
    }

    pub fn load_binary(&self, name: &str) -> Bytes {
        let mut path = self.0.clone();
        path.push(name);
        let result = fs::read(&path);
        if result.is_err() {
            panic!("Binary {:?} is missing!", path);
        }
        result.unwrap().into()
    }
}

// This helper method runs Context::verify_tx, but in case error happens,
// it also dumps current transaction to failed_txs folder.
pub fn verify_and_dump_failed_tx(
    context: &Context,
    tx: &TransactionView,
    max_cycles: u64,
) -> Result<Cycle, Error> {
    let result = context.verify_tx(tx, max_cycles);
    if result.is_err() {
        let mut path = env::current_dir().expect("current dir");
        path.push("failed_txs");
        std::fs::create_dir_all(&path).expect("create failed_txs dir");
        let mock_tx = context.dump_tx(tx).expect("dump failed tx");
        let json = serde_json::to_string_pretty(&mock_tx).expect("json");
        path.push(format!("0x{:x}.json", tx.hash()));
        println!("Failed tx written to {:?}", path);
        std::fs::write(path, json).expect("write");
    }
    result
}

pub fn assert_tx_error(
    context: &Context,
    tx: &TransactionView,
    err_code: ErrorCode,
    max_cycles: u64,
) {
    match context.verify_tx(tx, max_cycles) {
        Ok(_) => panic!(
            "expect error code {:?}({}), got success",
            err_code, err_code as i8
        ),
        Err(err) => {
            let error_string = err.to_string();
            assert!(
                error_string.contains(format!("error code {} ", err_code as i8).as_str()),
                "expect error code {:?}({}), got {}",
                err_code,
                err_code as i8,
                error_string,
            );
        }
    }
}

pub struct CellSpec {
    output: packed::CellOutputBuilder,
    data: Bytes,
    since: packed::Uint64,
}

pub trait TxSpec {
    fn new_dao_input_spec(&mut self) -> CellSpec;
    fn new_dao_output_spec(&mut self) -> CellSpec;
    fn new_tx_builder(
        &mut self,
        dao_input_spec: CellSpec,
        dao_output_spec: CellSpec,
    ) -> TransactionBuilder;
    fn complete_tx(&mut self, tx: TransactionView) -> TransactionView;
}

pub fn build_tx<T: TxSpec>(spec: &mut T) -> TransactionView {
    let dao_input_spec = spec.new_dao_input_spec();
    let dao_output_spec = spec.new_dao_output_spec();
    let tx = spec.new_tx_builder(dao_input_spec, dao_output_spec).build();

    spec.complete_tx(tx)
}

pub struct DefaultTxSpec {
    context: Context,
    dao_input_out_point: packed::OutPoint,

    alice_lock_script: packed::Script,

    verifier_type_script: packed::Script,
    dao_type_script: packed::Script,
}

impl DefaultTxSpec {
    fn new() -> Self {
        let mut context = Context::default();
        let dao_input_out_point = random_out_point();
        let loader = Loader::default();

        // use always success as lock
        let always_success_out_point = context.deploy_cell((*ALWAYS_SUCCESS).clone());
        let alice_lock_script = context
            .build_script(&always_success_out_point, Bytes::from(vec![0xa]))
            .expect("script");

        // use always success as dao
        let dao_type_script = packed::Script::new_builder()
            .code_hash(
                hex!("82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e").pack(),
            )
            .hash_type(1.into())
            .build();
        let dao = packed::CellOutput::new_builder()
            .capacity(1000u64.pack())
            .lock(alice_lock_script.clone())
            .type_(
                Some(
                    packed::Script::new_builder()
                        .code_hash(
                            hex!(
                                "00000000000000000000000000000000000000000000000000545950455f4944"
                            )
                            .pack(),
                        )
                        .hash_type(1.into())
                        .args(
                            hex!(
                                "b2a8500929d6a1294bf9bf1bf565f549fa4a5f1316a3306ad3d4783e64bcf626"
                            )
                            .to_vec()
                            .pack(),
                        )
                        .build(),
                )
                .pack(),
            )
            .build();
        context.create_cell(dao, (*ALWAYS_SUCCESS).clone());

        // verifier cell
        let verifier_out_point = context.deploy_cell(loader.load_binary("dao-action-verifier"));
        let verifier_type_script = context
            .build_script(&verifier_out_point, Default::default())
            .expect("script");

        Self {
            context,
            dao_input_out_point,
            alice_lock_script,
            verifier_type_script,
            dao_type_script,
        }
    }

    pub fn pack_dao_data(&self, action_data: Bytes) -> Bytes {
        self.pack_dao_data_vec(vec![action_data])
    }

    pub fn pack_dao_operations(
        &self,
        deposits: Vec<Deposit>,
        withdraws: Vec<Withdraw>,
        claims: Vec<Claim>,
    ) -> Bytes {
        self.pack_dao_data(
            DaoActionData::new_builder()
                .deposits(DepositVec::new_builder().set(deposits).build())
                .withdraws(WithdrawVec::new_builder().set(withdraws).build())
                .claims(ClaimVec::new_builder().set(claims).build())
                .build()
                .as_bytes(),
        )
    }

    pub fn pack_dao_data_vec(&self, action_data_vec: Vec<Bytes>) -> Bytes {
        let script_hash = blake2b_256(self.dao_type_script.as_slice());
        let actions = ActionVec::new_builder()
            .set(
                action_data_vec
                    .into_iter()
                    .map(|data| {
                        Action::new_builder()
                            .script_hash(script_hash.pack())
                            .data(data.pack())
                            .build()
                    })
                    .collect(),
            )
            .build();
        let message = Message::new_builder().actions(actions).build();
        WitnessLayout::new_builder()
            .set(WitnessLayoutUnion::SighashAll(
                SighashAll::new_builder().message(message).build(),
            ))
            .build()
            .as_bytes()
    }
}

impl Default for DefaultTxSpec {
    fn default() -> Self {
        Self::new()
    }
}

pub const DEFAULT_CAPACITY: u64 = 1000_0000_0000;
pub const DAO_DEPOSIT_DATA: [u8; 8] = hex!("0000000000000000");
pub const DAO_CYCLE: u64 = 180;
pub const ESITMATED_EPOCH_DURATION: u64 = 4 * 60 * 60 * 1000;
// data: 8, the block number
// capacity: 8
// lock: 32+1+1, always success + arg(1)
// type: 32+1, dao + arg(0)
pub const DAO_INPUT_OCCUPIED_CAPACITY: u64 = 83_0000_0000;

pub fn pack_capacity(shannons: u64) -> Capacity {
    Capacity::new_unchecked(Bytes::from(shannons.to_le_bytes().to_vec()))
}

pub fn pack_uint64(number: u64) -> DaoActionUint64 {
    DaoActionUint64::new_unchecked(Bytes::from(number.to_le_bytes().to_vec()))
}

pub fn pack_ar(ar: u64) -> packed::Byte32 {
    let mut dao_buf = vec![0u8; 32];
    dao_buf[8..16].copy_from_slice(&ar.to_le_bytes());
    packed::Byte32::new_unchecked(Bytes::from(dao_buf))
}

impl TxSpec for DefaultTxSpec {
    fn new_dao_input_spec(&mut self) -> CellSpec {
        CellSpec {
            output: packed::CellOutput::new_builder()
                .capacity(DEFAULT_CAPACITY.pack())
                .lock(self.alice_lock_script.clone()),
            data: Bytes::new(),
            since: 0.pack(),
        }
    }

    fn new_dao_output_spec(&mut self) -> CellSpec {
        CellSpec {
            output: packed::CellOutput::new_builder()
                .capacity(DEFAULT_CAPACITY.pack())
                .type_(Some(self.dao_type_script.clone()).pack())
                .lock(self.alice_lock_script.clone()),
            data: Bytes::from(DAO_DEPOSIT_DATA.to_vec()),
            since: 0.pack(),
        }
    }

    fn new_tx_builder(
        &mut self,
        dao_input_spec: CellSpec,
        dao_output_spec: CellSpec,
    ) -> TransactionBuilder {
        self.context.create_cell_with_out_point(
            self.dao_input_out_point.clone(),
            dao_input_spec.output.build(),
            dao_input_spec.data,
        );
        let dao_input = packed::CellInput::new_builder()
            .previous_output(self.dao_input_out_point.clone())
            .since(dao_input_spec.since)
            .build();
        let dao_output = dao_output_spec.output.build();

        let verifier_cell = self.context.create_cell(
            packed::CellOutput::new_builder()
                .capacity(DEFAULT_CAPACITY.pack())
                .lock(self.alice_lock_script.clone())
                .type_(Some(self.verifier_type_script.clone()).pack())
                .build(),
            Bytes::new(),
        );
        let verifier_input = packed::CellInput::new_builder()
            .previous_output(verifier_cell)
            .build();
        let verifier_output = packed::CellOutput::new_builder()
            .capacity(DEFAULT_CAPACITY.pack())
            .lock(self.alice_lock_script.clone())
            .build();

        TransactionBuilder::default()
            .inputs(vec![dao_input, verifier_input])
            .outputs(vec![dao_output, verifier_output])
            .outputs_data([dao_output_spec.data, Bytes::new()].pack())
            .witnesses([Bytes::new(), Bytes::new()].pack())
    }

    fn complete_tx(&mut self, tx: TransactionView) -> TransactionView {
        self.context.complete_tx(tx)
    }
}

#[derive(Default)]
pub struct CustomTxSpec {
    inner: DefaultTxSpec,
    on_new_input_spec: Option<Box<dyn Fn(CellSpec) -> CellSpec>>,
    on_new_output_spec: Option<Box<dyn Fn(CellSpec) -> CellSpec>>,
    on_new_tx_builder: Option<Box<dyn Fn(TransactionBuilder) -> TransactionBuilder>>,
}

impl TxSpec for CustomTxSpec {
    fn new_dao_input_spec(&mut self) -> CellSpec {
        let cell_spec = self.inner.new_dao_input_spec();
        match &self.on_new_input_spec {
            Some(cb) => cb(cell_spec),
            None => cell_spec,
        }
    }
    fn new_dao_output_spec(&mut self) -> CellSpec {
        let cell_spec = self.inner.new_dao_output_spec();
        match &self.on_new_output_spec {
            Some(cb) => cb(cell_spec),
            None => cell_spec,
        }
    }

    fn new_tx_builder(
        &mut self,
        dao_input_spec: CellSpec,
        dao_output_spec: CellSpec,
    ) -> TransactionBuilder {
        let tx_builder = self.inner.new_tx_builder(dao_input_spec, dao_output_spec);
        match &self.on_new_tx_builder {
            Some(cb) => cb(tx_builder),
            None => tx_builder,
        }
    }

    fn complete_tx(&mut self, tx: TransactionView) -> TransactionView {
        self.inner.complete_tx(tx)
    }
}

impl CustomTxSpec {
    pub fn on_new_tx_builder<F>(&mut self, cb: F) -> &mut Self
    where
        F: Fn(TransactionBuilder) -> TransactionBuilder + 'static,
    {
        self.on_new_tx_builder = Some(Box::new(cb));
        self
    }

    pub fn on_new_input_spec<F>(&mut self, cb: F) -> &mut Self
    where
        F: Fn(CellSpec) -> CellSpec + 'static,
    {
        self.on_new_input_spec = Some(Box::new(cb));
        self
    }

    pub fn on_new_output_spec<F>(&mut self, cb: F) -> &mut Self
    where
        F: Fn(CellSpec) -> CellSpec + 'static,
    {
        self.on_new_output_spec = Some(Box::new(cb));
        self
    }
}

// Create an out point that does not exist in the tx.
pub fn non_existing_out_point() -> packed::OutPoint {
    packed::OutPoint::new_builder()
        .index(u32::MAX.pack())
        .build()
}

pub fn create_withdraw_spec<F>(
    deposit_header: HeaderView,
    estimated_withdraw_header: Option<HeaderView>,
    withdraw_builder: F,
) -> CustomTxSpec
where
    F: Fn(&mut CustomTxSpec) -> Withdraw,
{
    let mut spec = CustomTxSpec::default();

    let withdraw = withdraw_builder(&mut spec);
    let mut witnesses = vec![
        Bytes::new(),
        Bytes::new(),
        spec.inner
            .pack_dao_operations(vec![], vec![withdraw], vec![]),
    ];

    let deposit_header_hash = deposit_header.hash();
    let deposit_block_number = pack_uint64(deposit_header.number());
    spec.inner.context.insert_header(deposit_header);
    spec.inner.context.link_cell_with_block(
        spec.inner.dao_input_out_point.clone(),
        deposit_header_hash.clone(),
        0,
    );
    let mut header_deps = vec![deposit_header_hash];
    if let Some(withdraw_header) = estimated_withdraw_header {
        header_deps.push(withdraw_header.hash());
        spec.inner.context.insert_header(withdraw_header);
        witnesses[0] = packed::WitnessArgs::new_builder()
            .input_type(Some(Bytes::from(1u64.to_le_bytes().to_vec())).pack())
            .build()
            .as_bytes();
    }

    let dao_type_script = spec.inner.dao_type_script.clone();
    spec.on_new_input_spec(move |cell| CellSpec {
        output: cell.output.type_(Some(dao_type_script.clone()).pack()),
        data: Bytes::from(DAO_DEPOSIT_DATA.to_vec()),
        ..cell
    });
    spec.on_new_output_spec(move |cell| CellSpec {
        data: deposit_block_number.as_bytes(),
        ..cell
    });

    spec.on_new_tx_builder(move |b| {
        b.set_witnesses(vec![])
            .witnesses(witnesses.clone().pack())
            .header_deps(header_deps.clone())
    });

    spec
}

pub fn new_header_builder(number: u64, epoch_length: u64) -> HeaderBuilder {
    let epoch_number = number / epoch_length;
    let index = number % epoch_length;

    HeaderBuilder::default()
        .number(number.pack())
        .epoch(EpochNumberWithFraction::new(epoch_number, index, epoch_length).pack())
}
