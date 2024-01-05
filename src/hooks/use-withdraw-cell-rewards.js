import { useState, useEffect } from "react";
import { BI } from "@ckb-lumos/bi";

import { getConfig } from "@/lib/config";
import { isDaoWithdrawCell } from "@/lib/cobuild/assets-manager";
import { getWithdrawCellRewardWithCache } from "@/actions/get-withdraw-cell-reward";

export default function useWithdrawCellRewards(buildingPacket, config) {
  config = config ?? getConfig();
  const [withdrawnCellRewards, setWithdrawnCellRewards] = useState([]);

  useEffect(() => {
    const toFetch = [];
    for (const [
      i,
      cellOutput,
    ] of buildingPacket.value.resolvedInputs.outputs.entries()) {
      const cellData = buildingPacket.value.resolvedInputs.outputsData[i];
      if (isDaoWithdrawCell(cellOutput, cellData, config.ckbChainConfig)) {
        toFetch.push([
          i,
          buildingPacket.value.payload.inputs[i].previousOutput,
        ]);
      }
    }

    Promise.all(
      toFetch.map(([_i, outPoint]) => getWithdrawCellRewardWithCache(outPoint)),
    ).then((rewards) => {
      const result = [];
      for (const [i, reward] of rewards.entries()) {
        result[toFetch[i][0]] = reward ? BI.from(reward) : null;
      }
      setWithdrawnCellRewards(result);
    });
  }, [buildingPacket, setWithdrawnCellRewards, config.ckbChainConfig]);

  return withdrawnCellRewards;
}
