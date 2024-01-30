#![no_std]
#![cfg_attr(not(test), no_main)]

#[cfg(test)]
extern crate alloc;

#[cfg(not(test))]
use ckb_std::default_alloc;
#[cfg(not(test))]
ckb_std::entry!(program_entry);
#[cfg(not(test))]
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
