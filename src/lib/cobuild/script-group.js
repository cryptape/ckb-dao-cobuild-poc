import { utils as lumosBaseUtils } from "@ckb-lumos/base";
const { computeScriptHash } = lumosBaseUtils;

export function groupByLock(cellOutputs) {
  const groups = {};
  for (const [i, v] of cellOutputs.entries()) {
    const key = computeScriptHash(v.lock);
    const list = (groups[key] ??= []);
    list.push([i, v]);
  }
  return groups;
}
