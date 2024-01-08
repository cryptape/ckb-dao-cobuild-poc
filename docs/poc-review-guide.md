# PoC Review Guide

Cobuild is still under active development. Please refer to [ckb-transaction-cobuild-poc](https://github.com/cryptape/ckb-transaction-cobuild-poc) for contract supports.

The core principle of the PoC is how the CKB system DAO would look like if it supports Cobuild.

The general workflow to build transactions in Cobuild:

1. Create an empty **BuildingPacket** structure to initiate building a new transaction.
2. (Type Script Phase) Users perform some operations often by submitting forms. For each operation:
    - a. Find the corresponding papp (name for dapp in Cobuid) and create an **Action**.
    - b. Let the papp process the **Action**. Update transaction in the **BuildingPacket** structure and add the **Action** as a message Action to `BuildingPacketV1.message.actions`
3. (Fee Estimation Phase) Estimate witnesses size for fee calculation.
    - a. Ensure all message **Action**s have been completed.
    - b. (Optional) Remove message **Action**s that are experimental. For example, before DAO updates its contract, the DAO operations as message **Action**s are not validated. It's better to remove it to avoid inconsistent data.
    - c. For each lock script group: choose Cobuild or WitnessArgs layout and set the witness to enough size for fee estimation.
    - d. If there're witnesses are using `SighashAll` or `SighashAllOnly`. Set the first of such witnesses to `SighashAll` and put message **Action**s into it, and the remaining to `SighashAllOnly`.
    - e. If there's no such witnesses, and there's at least one message **Action**, add a `SighashAll` witness at a position beyond the number of inputs and save message **Action**s in it.
    - f. Estimate tx size and pay fee. If there are new cells added, ensure the witness size is correct for fee estimation.
4. (Lock Script Phase) Prepare to finalize the transaction. For each lock script group:
    - a. Set witness for digest computation.
    - b. Compute the digest for the script group.
    - c. Connect wallet to create signatures from digests.
    - d. Store the signature into the witness.
5. Finish, send the transaction to CKB.

## Map Code To Steps

The core is the step 2. There will be a framework to handle 1, 3, 4, 5, I just build a minimal framework to make the PoC work.

1. `src/lib/cobuild/types.js`: Cobuild data structures definition.
2. `src/lib/papps/dao`: DAO papp
    - a.
        - `src/lib/papps/dao/schema.js`: Action.data schema
        - `src/lib/papps/dao/action-creators.js`: Functions to create Action.data for DAO.
    - b. `src/lib/papps/dao/lumos-callbacks.js`: Build transactions based on DAO message actions.
3. `src/lib/cobuild/fee-manager.js`: See the function `payFee` and `storeWitnessForFeeEstimation`
4. `src/lib/cobuild/lock-actions.js`: See the function `prepareLockActions`.
    - a/b. `src/lib/cobuild/general-lock-actions.js`: See the function `prepareLockActionWithWitnessStore`
    - c. `src/lib/wallet/selector.js` acts as a gateway to connect different wallets and create signatures.
    - c. `src/lib/cobuild/general-lock-actions.js`: See the function `applyLockAction`
5. `src/app/u/[wallet]/[connection]/submit-building-packet.js`: a simple UI to send tx and query its status.

Remarks:

- `src/lib/cobuild/react/building-packet-review.js`: UI to review the building packet for signing.
