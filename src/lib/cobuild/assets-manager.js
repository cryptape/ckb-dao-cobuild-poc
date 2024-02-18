import { Indexer } from "@ckb-lumos/ckb-indexer";
import { addressToScript } from "@ckb-lumos/helpers";
import { BI } from "@ckb-lumos/bi";
import { buildScript } from "@/lib/config";

export const DEPOSIT_DAO_DATA = "0x0000000000000000";

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

async function reduceVerifierCells(collector) {
  const cells = [];

  for await (const cell of collector.collect()) {
    cells.push(cell);
  }

  return cells;
}

function buildDaoScript(ckbChainConfig) {
  return buildScript(ckbChainConfig.SCRIPTS.DAO, "0x");
}

function buildVerifierScript(ckbChainConfig) {
  return buildScript(ckbChainConfig.SCRIPTS.DAO_ACTION_VERIFIER, "0x");
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

  const verifierCollector = indexer.collector({
    lock,
    argsLen: (lock.args.length - 2) / 2,
    type: buildVerifierScript(ckbChainConfig),
  });
  const verifierCells = await reduceVerifierCells(verifierCollector);

  return { ckbBalance, daoCells, verifierCells };
}

export function isDaoWithdrawCell(cellOutput, cellData, ckbChainConfig) {
  const dao = ckbChainConfig.SCRIPTS.DAO;
  return (
    cellOutput.type?.codeHash === dao.CODE_HASH && cellData !== DEPOSIT_DAO_DATA
  );
}

export function isDaoDepositCell(cellOutput, cellData, ckbChainConfig) {
  const dao = ckbChainConfig.SCRIPTS.DAO;
  return (
    cellOutput.type?.codeHash === dao.CODE_HASH && cellData === DEPOSIT_DAO_DATA
  );
}

export function isNoneDaoTypedCell(cellOutput, ckbChainConfig) {
  const dao = ckbChainConfig.SCRIPTS.DAO;
  return cellOutput.type && cellOutput.type.codeHash !== dao.CODE_HASH;
}
