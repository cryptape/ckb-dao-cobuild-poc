use ckb_dao_cobuild_schemas::{
    Claim, ClaimVec, DaoActionData, Deposit, DepositVec, Withdraw, WithdrawVec,
};
use molecule::prelude::*;

#[test]
fn test_pack() {
    let deposit = Deposit::new_builder().build();
    let withdraw = Withdraw::new_builder().build();
    let claim = Claim::new_builder().build();
    DaoActionData::new_builder()
        .deposits(DepositVec::new_builder().push(deposit).build())
        .withdraws(WithdrawVec::new_builder().push(withdraw).build())
        .claims(ClaimVec::new_builder().push(claim).build())
        .build();
}
