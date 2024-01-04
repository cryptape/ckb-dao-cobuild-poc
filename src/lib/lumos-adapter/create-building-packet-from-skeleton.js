import { createTransactionFromSkeleton } from "@ckb-lumos/helpers";

export default function createBuildingPacketFromSkeleton(txSkeleton) {
  const resolvedInputs = {
    outputs: txSkeleton
      .get("inputs")
      .map((cell) => cell.cellOutput)
      .toJSON(),
    outputsData: txSkeleton
      .get("inputs")
      .map((cell) => cell.data)
      .toJSON(),
  };
  const payload = createTransactionFromSkeleton(txSkeleton);

  const maxLockedOutput = txSkeleton
    .get("fixedEntries")
    .filter(({ field }) => field === "outputs")
    .maxBy(({ index }) => index);
  const changeOutput =
    maxLockedOutput === undefined ||
    maxLockedOutput.index < payload.outputs.length - 1
      ? payload.outputs.length - 1
      : undefined;

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

export function mergeBuildingPacketFromSkeleton(buildingPacket, txSkeleton) {
  const newBuildingPacket = createBuildingPacketFromSkeleton(txSkeleton);
  return {
    type: "BuildingPacketV1",
    value: {
      ...buildingPacket.value,
      payload: newBuildingPacket.value.payload,
      resolvedInputs: newBuildingPacket.value.resolvedInputs,
      changeOutput: newBuildingPacket.value.changeOutput,
    },
  };
}
