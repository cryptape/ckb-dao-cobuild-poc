import { blockchain, utils as ckbBaseUtils } from "@ckb-lumos/base";
import { bytes, number, molecule } from "@ckb-lumos/codec";

import { ScriptInfo, Message } from "./types";

const { union, table, vector } = molecule;
const { Uint32 } = number;
const { ckbHash, CKBHasher } = ckbBaseUtils;

export function prepareLockAction(
  buildingPacket,
  scriptHash,
  inputIndices,
  createWitnessArgsPlaceholder,
) {
  const scriptInfo = { ...GeneralLockScriptInfo, scriptHash };
  const scriptInfoHash = ckbHash(ScriptInfo.pack(scriptInfo));
  const witnessStore = chooseWitnessStore(buildingPacket, inputIndices);
  const digest = createDigest(
    buildingPacket,
    inputIndices,
    createWitnessArgsPlaceholder,
    witnessStore,
  );
  const data = GeneralLockAction.pack({
    digest,
    witnessStore,
  });
  const action = {
    scriptInfoHash,
    scriptHash,
    data,
  };

  buildingPacket.value.lockActions.push(action);
  return buildingPacket;
}

export function chooseWitnessStore(buildingPacket, inputIndices) {
  // Use Cobuild when all witnesses are empty
  for (const i of inputIndices) {
    const witness = buildingPacket.value.payload.witnesses[i];
    if (witness !== null && witness !== undefined && witness !== "0x") {
      return {
        type: "WitnessArgsStore",
        value: { inputIndices },
      };
    }
  }

  return {
    type:
      inputIndices[0] === 0
        ? "CobuildSighashAllStore"
        : "CobuildSighashAllOnlyStore",
    value: { inputIndices },
  };
}

export function createDigest(
  buildingPacket,
  inputIndices,
  createWitnessArgsPlaceholder,
  witnessStore,
) {
  if (witnessStore.type !== "WitnessArgsStore") {
    return createCobuildDigest(buildingPacket);
  } else {
    return createWitnessArgsDigest(
      buildingPacket,
      inputIndices,
      createWitnessArgsPlaceholder,
    );
  }
}

function computeTxHash(tx) {
  return ckbHash(blockchain.RawTransaction.pack(tx));
}

export function createCobuildDigest(buildingPacket) {
  const tx = buildingPacket.value.payload;
  const txHash = computeTxHash(tx);

  const skeletonHasher = new CKBHasher();
  skeletonHasher.update(bytes.bytify(txHash));
  for (const witness of tx.witnesses.slice(tx.inputs.length)) {
    const witnessBytes = bytes.bytify(witness);
    skeletonHasher.update(
      bytes.bytify(number.Uint64LE.pack(witnessBytes.length)),
    );
    skeletonHasher.update(witnessBytes);
  }
  const skeletonHash = bytes.bytify(skeletonHasher.digestHex());

  const message = bytes.bytify(Message.pack(buildingPacket.value.message));

  const hasher = new CKBHasher();
  hasher.update(skeletonHash);
  hasher.update(bytes.bytify(number.Uint64LE.pack(message.length)));
  hasher.update(message);
  return hasher.digestHex();
}

export function createWitnessArgsDigest(
  buildingPacket,
  inputIndices,
  createWitnessArgsPlaceholder,
) {
  const tx = buildingPacket.value.payload;
  const txHash = computeTxHash(tx);

  const hasher = new CKBHasher();

  hasher.update(bytes.bytify(txHash));

  const firstWitness = tx.witnesses[inputIndices[0]] ?? "0x";
  const firstWitnessArgs =
    firstWitness !== null && firstWitness !== undefined && firstWitness !== "0x"
      ? blockchain.WitnessArgs.unpack(firstWitness)
      : {};
  firstWitnessArgs.lock = createWitnessArgsPlaceholder(
    buildingPacket,
    inputIndices,
  );
  const firstWitnessBytes = bytes.bytify(
    blockchain.WitnessArgs.pack(firstWitnessArgs),
  );
  hasher.update(bytes.bytify(number.Uint64LE.pack(firstWitnessBytes.length)));
  hasher.update(firstWitnessBytes);

  for (const i of inputIndices.slice(1)) {
    const witnessBytes = bytes.bytify(tx.witnesses[i] ?? "0x");
    hasher.update(bytes.bytify(number.Uint64LE.pack(witnessBytes.length)));
    hasher.update(witnessBytes);
  }

  for (const witness of tx.witnesses.slice(tx.inputs.length)) {
    const witnessBytes = bytes.bytify(witness);
    hasher.update(bytes.bytify(number.Uint64LE.pack(witnessBytes.length)));
    hasher.update(witnessBytes);
  }

  return hasher.digestHex();
}

export const GENERAL_LOCK_SCHEMA = `
array Uint32 [byte; 4];
array Byte32 [byte; 32];
vecotr Uint32Vec <Uint32>;

table WitnessArgsStore {
    input_indices: Uint32Vec,
}
table CobuildSighashAllStore {
    input_indices: Uint32Vec,
}
table CobuildSighashAllOnlyStore {
    input_indices: Uint32Vec,
}

enum WitnessStore {
    WitnessArgsStore,
    CobuildSighashAllStore,
    CobuildSighashAllOnlyStore,
}

table GeneralLockAction {
    digest: Byte32,
    witness_store: WitnessStore,
}
`;

export const Uint32Vec = vector(Uint32);

export const WitnessArgsStore = table(
  {
    inputIndices: Uint32Vec,
  },
  ["inputIndices"],
);
export const CobuildSighashAllStore = table(
  {
    inputIndices: Uint32Vec,
  },
  ["inputIndices"],
);
export const CobuildSighashAllOnlyStore = table(
  {
    inputIndices: Uint32Vec,
  },
  ["inputIndices"],
);

export const WitnessStore = union(
  { WitnessArgsStore, CobuildSighashAllStore, CobuildSighashAllOnlyStore },
  ["WitnessArgsStore", "CobuildSighashAllStore", "CobuildSighashAllOnlyStore"],
);

export const GeneralLockAction = table(
  {
    digest: blockchain.Byte32,
    witnessStore: WitnessStore,
  },
  ["digest", "witnessStore"],
);

export const GeneralLockScriptInfo = {
  name: bytes.bytifyRawString("GeneralLock"),
  url: bytes.bytifyRawString("https://github.com/doitian/ckb-dao-cobuild-poc"),
  scriptHash: null,
  schema: bytes.bytifyRawString(GENERAL_LOCK_SCHEMA),
  messageType: bytes.bytifyRawString("GeneralLockAction"),
};
