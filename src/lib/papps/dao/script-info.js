import { getConfig, buildScript } from "@/lib/config";
import {
  createScriptInfoFromHumanTemplate,
  computeScriptInfoHash,
} from "@/lib/cobuild/script-info";
import { utils as lumosBaseUtils } from "@ckb-lumos/base";

import { SCHEMA, MESSAGE_TYPE } from "./schema";

const { computeScriptHash } = lumosBaseUtils;
const CONFIG = getConfig();

export function getDaoHumanScriptInfoTemplate() {
  return {
    name: "CKB DAO",
    url: "https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md",
    schema: SCHEMA,
    messageType: MESSAGE_TYPE,
  };
}

function getDaoScriptHashFromConfig(config) {
  const daoInfo = config.ckbChainConfig.SCRIPTS.DAO;
  const daoScript = buildScript(daoInfo, "0x");
  return computeScriptHash(daoScript);
}

function getDaoScriptInfoFromConfig(config) {
  const scriptHash = getDaoScriptHashFromConfig(config);
  return createScriptInfoFromHumanTemplate(
    getDaoHumanScriptInfoTemplate(),
    scriptHash,
  );
}

const SCRIPT_HASH = getDaoScriptHashFromConfig(CONFIG);
const SCRIPT_INFO = getDaoScriptInfoFromConfig(CONFIG);
const SCRIPT_INFO_HASH = computeScriptInfoHash(SCRIPT_INFO);

export function getDaoScriptHash(config = undefined) {
  return config === null || config === undefined || config === CONFIG
    ? SCRIPT_HASH
    : getDaoScriptHashFromConfig(config);
}

export function getDaoScriptInfo(config = undefined) {
  return config === null || config === undefined || config === CONFIG
    ? SCRIPT_INFO
    : getDaoScriptInfoFromConfig(config);
}

export function getDaoScriptInfoHash(config = undefined) {
  return config === null || config === undefined || config === CONFIG
    ? SCRIPT_INFO_HASH
    : computeScriptInfoHash(getDaoScriptInfoFromConfig(config));
}
