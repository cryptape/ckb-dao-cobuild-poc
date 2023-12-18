use ckb_hash::new_blake2b;
use ckb_testtool::{
    ckb_error::Error,
    ckb_types::{bytes::Bytes, core::TransactionView, packed, prelude::*},
};
use std::env;
use std::fs;
use std::path::PathBuf;
use std::str::FromStr;

#[cfg(test)]
mod tests;

const TEST_ENV_VAR: &str = "CAPSULE_TEST_ENV";

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
            Err(_) => TestEnv::Debug,
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
        env::current_dir().unwrap();
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
        base_path.push(load_prefix);
        Loader(base_path)
    }

    pub fn load_binary(&self, name: &str) -> Bytes {
        let mut path = self.0.clone();
        path.push(name);
        fs::read(&path)
            .expect(&format!("binary at {}", path.display()))
            .into()
    }

    pub fn load_joyid_cobuild_poc_binary(&self) -> Bytes {
        self.load_binary("joyid-cobuild-poc")
    }
}

pub fn assert_script_ok(result: Result<u64, Error>) {
    if let Err(err) = result {
        panic!("expect ok got error: {}", err);
    }
}

pub fn assert_script_err_code(result: Result<u64, Error>, err_code: i8) {
    match result.err() {
        Some(err) => {
            let error_string = err.to_string();
            assert!(
                error_string.contains(format!("error code {} ", err_code).as_str()),
                "error_string: {}, expected_error_code: {}",
                error_string,
                err_code
            );
        }
        None => {
            panic!("error: None, expected_error_code: {}", err_code);
        }
    }
}

pub fn compute_sighash(tx: &TransactionView, lock_group_indices: Vec<usize>) -> [u8; 32] {
    let witness = packed::WitnessArgs::new_unchecked(
        tx.witnesses()
            .get(lock_group_indices[0])
            .expect("get lock group witness")
            .raw_data(),
    );
    let witness_for_signing = witness
        .as_builder()
        .lock((None as Option<Bytes>).pack())
        .build()
        .as_bytes();

    let mut blake2b = new_blake2b();
    let mut message = [0u8; 32];

    blake2b.update(&tx.hash().raw_data());
    blake2b.update(&(witness_for_signing.len() as u64).to_le_bytes());
    blake2b.update(&witness_for_signing);

    // group
    for i in &lock_group_indices[1..] {
        let witness = tx.witnesses().get(*i).unwrap();

        blake2b.update(&(witness.len() as u64).to_le_bytes());
        blake2b.update(&witness.raw_data());
    }

    let normal_witness_len = std::cmp::max(tx.inputs().len(), tx.outputs().len());
    for i in tx.inputs().len()..normal_witness_len {
        let witness = tx.witnesses().get(i).expect("get witness");

        blake2b.update(&(witness.len() as u64).to_le_bytes());
        blake2b.update(&witness.raw_data());
    }

    blake2b.finalize(&mut message);
    message
}
