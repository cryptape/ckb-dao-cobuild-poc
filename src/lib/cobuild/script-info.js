import { utils as lumosBaseUtils } from "@ckb-lumos/base";
import { bytes } from "@ckb-lumos/codec";

import { ScriptInfo } from "./types";

const { ckbHash } = lumosBaseUtils;

export function encodeString(jsString) {
  return bytes.hexify(bytes.bytifyRawString(jsString));
}

export function encodeScriptInfo({
  name,
  url,
  scriptHash,
  schema,
  messageType,
}) {
  return {
    name: encodeString(name),
    url: encodeString(url),
    schema: encodeString(schema),
    messageType: encodeString(messageType),
    scriptHash,
  };
}

export function createScriptInfoFromHumanTemplate(humanTemplate, scriptHash) {
  return encodeScriptInfo({
    ...humanTemplate,
    scriptHash,
  });
}

export function computeScriptInfoHash(humanScriptInfo) {
  const scriptInfo = encodeScriptInfo(humanScriptInfo);
  return bytes.hexify(ckbHash(ScriptInfo.pack(scriptInfo)));
}
