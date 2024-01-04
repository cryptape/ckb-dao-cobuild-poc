import { Indexer } from "@ckb-lumos/ckb-indexer";

export function createSkeletonFromBuildingPacket(
  buildingPacket,
  { ckbRpcUrl } = {},
) {
  const transaction = buildingPacket.value.payload;
  const resolvedInputs = buildingPacket.value.resolvedInputs;

  let txSkeletonMutable = TransactionSkeleton().asMutable();
  txSkeletonMutable.update("cellDeps", (cellDeps) =>
    cellDeps.push(...transaction.cellDeps),
  );
  txSkeletonMutable.update("headerDeps", (headerDeps) =>
    headerDeps.push(...transaction.headerDeps),
  );

  const inputCells = transaction.inputs.map((input, i) => ({
    outPoint: input.previousOutput,
    cellOutput: resolvedInputs.outputs[i],
    data: resolvedInputs.outputsData[i],
  }));
  txSkeletonMutable.update("inputs", (inputs) => inputs.push(...inputCells));
  txSkeletonMutable.update("inputSinces", (inputSinces) =>
    transaction.inputs.reduce(
      (map, input, i) => map.set(i, input.since),
      inputSinces,
    ),
  );

  const outputCells = transaction.outputs.map((output, index) => ({
    cellOutput: output,
    data: transaction.outputsData[index] ?? "0x",
  }));
  txSkeletonMutable.update("outputs", (outputs) =>
    outputs.push(...outputCells),
  );
  txSkeletonMutable.update("witnesses", (witnesses) =>
    witnesses.push(...transaction.witnesses),
  );

  // lock outputs except the change output
  const lockedOutputs = Array.from(Array(transaction.outputs.length).keys())
    .filter((i) => i !== buildingPacket.value.changeOutput)
    .map((index) => ({ field: "outputs", index }));
  txSkeletonMutable.update("fixedEntries", (fixedEntries) =>
    fixedEntries.push(...lockedOutputs),
  );

  if (ckbRpcUrl !== null && ckbRpcUrl !== undefined) {
    txSkeletonMutable.set("cellProvider", new Indexer(ckbRpcUrl));
  }

  return txSkeletonMutable.asImmutable();
}

export default createSkeletonFromBuildingPacket;
