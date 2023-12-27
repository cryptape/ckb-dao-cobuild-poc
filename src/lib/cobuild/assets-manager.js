import { Indexer } from "@ckb-lumos/ckb-indexer";
import { addressToScript } from "@ckb-lumos/helpers";
import { BI } from "@ckb-lumos/bi";

const DEPOSIT_DAO_DATA = "0x0000000000000000";

async function reduceCkb(collector) {
  let balance = BI.from(0);

  for await (const cell of collector.collect()) {
    balance = balance.add(cell.cellOutput.capacity);
  }

  return balance;
}

async function reduceDao(collector) {
  const deposits = [];
  const withdraws = [];

  for await (const cell of collector.collect()) {
    if (cell.data === DEPOSIT_DAO_DATA) {
      deposits.push(cell);
    } else {
      withdraws.push(cell);
    }
  }

  return { deposits, withdraws };
}

function buildDaoScript(ckbChainConfig) {
  const template = ckbChainConfig.SCRIPTS.DAO;

  return {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args: "0x",
  };
}

export async function fetchAssets(address, { ckbRpcUrl, ckbChainConfig }) {
  const lock = addressToScript(address, { config: ckbChainConfig });
  const indexer = new Indexer(ckbRpcUrl);

  const ckbCollector = indexer.collector({
    lock,
    argsLen: (lock.args.length - 2) / 2,
    type: "empty",
    data: "0x",
  });
  const ckbBalance = (await reduceCkb(ckbCollector)).toHexString();

  const daoCollector = indexer.collector({
    lock,
    argsLen: (lock.args.length - 2) / 2,
    type: buildDaoScript(ckbChainConfig),
  });
  const daoCells = await reduceDao(daoCollector);

  return { ckbBalance, daoCells };
}
