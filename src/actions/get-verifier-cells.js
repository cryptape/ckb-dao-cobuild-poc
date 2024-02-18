"use server";

import { cache } from "react";
import { getConfig, buildScript } from "@/lib/config";
import { addressToScript } from "@ckb-lumos/helpers";
import { Indexer } from "@ckb-lumos/ckb-indexer";

function buildVerifierScript(ckbChainConfig) {
  return buildScript(ckbChainConfig.SCRIPTS.DAO_ACTION_VERIFIER, "0x");
}

export async function getVerifierCellsWithoutCache(lockAddress, config) {
  const { ckbRpcUrl, ckbChainConfig } = config ?? getConfig();
  const indexer = new Indexer(ckbRpcUrl);

  const lock = addressToScript(lockAddress, { config: ckbChainConfig });
  const collector = indexer.collector({
    lock,
    argsLen: (lock.args.length - 2) / 2,
    type: buildVerifierScript(ckbChainConfig),
  });
  const verifierCells = [];
  for await (const cell of collector.collect()) {
    verifierCells.push(cell);
  }
  return verifierCells;
}

export const getVerifierCellsWithCache = cache(getVerifierCellsWithoutCache);
