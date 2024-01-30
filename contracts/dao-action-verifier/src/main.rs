#![no_std]
#![cfg_attr(not(test), no_main)]

#[cfg(any(not(target_arch = "riscv64"), test))]
extern crate alloc;

#[cfg(all(target_arch = "riscv64", not(test)))]
use ckb_std::default_alloc;
#[cfg(all(target_arch = "riscv64", not(test)))]
ckb_std::entry!(program_entry);
#[cfg(all(target_arch = "riscv64", not(test)))]
default_alloc!();

use ckb_std::error::SysError;
mod error;
mod error_code;

use error::Error;

pub fn program_entry() -> i8 {
    match verify() {
        Ok(_) => 0,
        Err(err) => err.into(),
    }
}

pub fn verify() -> Result<(), Error> {
    Err(trace_error!(SysError::IndexOutOfBound, "error"))
}
