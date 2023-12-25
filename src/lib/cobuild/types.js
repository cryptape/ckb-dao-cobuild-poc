import { blockchain } from "@ckb-lumos/base";
import { bytes, molecule, number } from "@ckb-lumos/codec";
const { Uint32LE, Uint32 } = number;
const { option, table, vector, union } = molecule;
const { Script, WitnessArgs } = blockchain;

export { blockchain };

export const Uint32Opt = option(Uint32);

export const String = blockchain.Bytes;

export const Address = union({ Script }, ["Script"]);

export const AddressOpt = option(Address);

export const Action = table(
  {
    scriptInfoHash: blockchain.Byte32,
    scriptHash: blockchain.Byte32,
    data: blockchain.Bytes,
  },
  ["scriptInfoHash", "scriptHash", "data"],
);

export const ActionVec = vector(Action);

export const Message = table({ actions: ActionVec }, ["actions"]);

export const ScriptInfo = table(
  {
    name: String,
    url: String,
    scriptHash: blockchain.Byte32,
    schema: String,
    messageType: String,
  },
  ["name", "url", "scriptHash", "schema", "messageType"],
);

export const ScriptInfoVec = vector(ScriptInfo);

export const ResolvedInputs = table(
  {
    outputs: blockchain.CellOutputVec,
    outputsData: blockchain.BytesVec,
  },
  ["outputs", "outputsData"],
);

export const BuildingPacketV1 = table(
  {
    message: Message,
    payload: blockchain.Transaction,
    resolvedInputs: ResolvedInputs,
    changeOutput: Uint32Opt,
    scriptInfos: ScriptInfoVec,
    lockActions: ActionVec,
  },
  [
    "message",
    "payload",
    "resolvedInputs",
    "changeOutput",
    "scriptInfos",
    "lockActions",
  ],
);

export const BuildingPacket = union({ BuildingPacketV1 }, ["BuildingPacketV1"]);

export const SighashAll = table({ seal: blockchain.Bytes, message: Message }, [
  "seal",
  "message",
]);

export const SighashAllOnly = table({ seal: blockchain.Bytes }, ["seal"]);

export const SighashOnly = table({ seal: blockchain.Bytes }, ["seal"]);

export const OtxStart = table(
  {
    startInputCell: Uint32,
    startOutputCell: Uint32,
    startCellDeps: Uint32,
    startHeaderDeps: Uint32,
  },
  ["startInputCell", "startOutputCell", "startCellDeps", "startHeaderDeps"],
);

export const Otx = table(
  {
    lock: blockchain.Bytes,
    inputCells: Uint32,
    outputCells: Uint32,
    cellDeps: Uint32,
    headerDeps: Uint32,
    message: Message,
  },
  ["lock", "inputCells", "outputCells", "cellDeps", "headerDeps", "message"],
);

export const WitnessLayoutFieldTags = {
  SighashAll: 4278190081,
  SighashAllOnly: 4278190082,
  Otx: 4278190083,
  OtxStart: 4278190084,
};
export const MinWitnessLayoutFieldTag = WitnessLayoutFieldTags.SighashAll;
export const WitnessLayout = union(
  { SighashAll, SighashAllOnly, Otx, OtxStart },
  WitnessLayoutFieldTags,
);

export function parseWitnessType(witness) {
  const buf = bytes.bytify(witness ?? []);
  if (buf.length > 4) {
    const typeIndex = Uint32LE.unpack(buf.slice(0, 4));
    if (typeIndex >= MinWitnessLayoutFieldTag) {
      for (const [name, index] of Object.entries(WitnessLayoutFieldTags)) {
        if (index === typeIndex) {
          return name;
        }
      }
    } else {
      return "WitnessArgs";
    }
  }

  throw new Error("Unknown witness format");
}

export function tryParseWitness(witness) {
  const buf = bytes.bytify(witness ?? []);
  if (buf.length > 4) {
    const typeIndex = Uint32LE.unpack(buf.slice(0, 4));
    try {
      if (typeIndex >= MinWitnessLayoutFieldTag) {
        return WitnessLayout.unpack(buf);
      } else {
        return {
          type: "WitnessArgs",
          value: WitnessArgs.unpack(buf),
        };
      }
    } catch (_err) {
      // passthrough
    }
  }

  throw new Error("Unknown witness format");
}
