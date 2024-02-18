# Packing Verifier

There are two ways to pack CoBuild message in the witness.

- If there's a lock script supports CoBuild in the transaction, it can utilize the new `WitnessLayout` format and pack the message in the `SighashAll` variant.
- If there are no lock scripts using the `WitnessLayout` witness format, the message can be packed as a `SighashAll` with an empty `seal`. It will then be stored at the witness position `n + 1`, where n represents the number of inputs in the transaction. This is possible because most lock scripts include the witnesses at positions beyond the input count in the digest to prevent tampering.

However, before system contract DAO upgrades, no scripts will verify the DAO action data in the CoBuild message. This proof-of-concept (PoC) employs a workaround to include the DAO verifier cell as an output in the transaction. The cell utilizes the [dao-action-verifier](../contracts/dao-action-verifier/) contract as its type script, ensuring the verification of the DAO action data.
