import { Indexer } from "@ckb-lumos/ckb-indexer";
import { addressToScript } from "@ckb-lumos/helpers";
import { BI } from "@ckb-lumos/bi";

export async function fetchAssets(address, { ckbRpcUrl, ckbChainConfig }) {
  const lock = addressToScript(address, { config: ckbChainConfig });
  const indexer = new Indexer(ckbRpcUrl);
  const collector = indexer.collector({
    lock,
    argsLen: (lock.args.length - 2) / 2,
  });

  let ckbBalance = BI.from(0);
  for await (const cell of collector.collect()) {
    const typeScript = cell.cellOutput.type;
    if (typeScript === null && cell.data === "0x") {
      ckbBalance = ckbBalance.add(cell.cellOutput.capacity);
    }
  }

  return { ckbBalance: ckbBalance.toHexString() };
}
