import { createTransactionFromSkeleton } from "@ckb-lumos/helpers";

export default function createBuildingPacketFromSkeleton(txSkeleton) {
  const resolvedInputs = {
    outputs: txSkeleton.inputs.map((cell) => cell.cellOutput).toJSON(),
    outputData: txSkeleton.inputs.map((cell) => cell.data).toJSON(),
  };
  const payload = createTransactionFromSkeleton(txSkeleton);
  return {
    type: "BuildingPacketV1",
    value: {
      message: {
        actions: [],
      },
      payload,
      resolvedInputs,
      changeOutput: null,
      scriptInfos: [],
      lockActions: [],
    },
  };
}
