import { Indexer } from "@ckb-lumos/ckb-indexer";
import { addressToScript } from "@ckb-lumos/helpers";
import { BI } from "@ckb-lumos/bi";

export async function fetchAssets(config, address) {
  const lock = addressToScript(address, { config: config.ckbChainConfig });
  const indexer = new Indexer(config.ckbRpcUrl);
  const collector = indexer.collector({ lock });

  const acc = {
    ckbBalance: BI.from(0),
  };
  for await (const cell of collector.collect()) {
    const typeScript = cell.cellOutput.type;
    if (typeScript === null) {
      acc.ckbBalance = acc.ckbBalance.add(cell.cellOutput.capacity);
    }
  }

  return acc;
}
