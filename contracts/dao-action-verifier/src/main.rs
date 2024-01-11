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

pub fn program_entry() -> i8 {
    ckb_std::debug!("This is a sample contract!");

    0
}
