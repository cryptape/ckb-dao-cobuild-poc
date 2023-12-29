import { createTransactionFromSkeleton } from "@ckb-lumos/helpers";

export default function createBuildingPacketFromSkeleton(
  txSkeleton,
  changeOutput,
) {
  const resolvedInputs = {
    outputs: txSkeleton.inputs.map((cell) => cell.cellOutput).toJSON(),
    outputsData: txSkeleton.inputs.map((cell) => cell.data).toJSON(),
  };
  const payload = createTransactionFromSkeleton(txSkeleton);
  return {
    type: "BuildingPacketV1",
    value: {
      message: {
        actions: [],
      },
      scriptInfos: [],
      lockActions: [],
      payload,
      resolvedInputs,
      changeOutput,
    },
  };
}
