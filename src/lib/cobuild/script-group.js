import { utils as lumosBaseUtils } from "@ckb-lumos/base";
const { computeScriptHash } = lumosBaseUtils;

export function groupByLock(cellOutputs) {
  return Object.groupBy(cellOutputs.entries(), ([_i, v]) =>
    computeScriptHash(v.lock),
  );
}
