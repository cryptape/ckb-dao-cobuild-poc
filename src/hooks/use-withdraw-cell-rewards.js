import { useState, useEffect } from "react";
import { BI } from "@ckb-lumos/bi";

import { useConfig } from "@/lib/config";
import { isDaoWithdrawCell } from "@/lib/cobuild/assets-manager";
import { getWithdrawCellRewardWithCache } from "@/actions/get-withdraw-cell-reward";

export default function useWithdrawCellRewards(buildingPacket, config) {
  config = config ?? useConfig();
  const [withdrawnCellRewards, setWithdrawnCellRewards] = useState([]);

  const toFetch = [];
  for (const [
    i,
    cellOutput,
  ] of buildingPacket.value.resolvedInputs.outputs.entries()) {
    const cellData = buildingPacket.value.resolvedInputs.outputsData[i];
    if (isDaoWithdrawCell(cellOutput, cellData, config.ckbChainConfig)) {
      toFetch.push([i, buildingPacket.value.payload.inputs[i].previousOutput]);
    }
  }

  useEffect(() => {
    Promise.all(
      toFetch.map(([_i, outPoint]) => getWithdrawCellRewardWithCache(outPoint)),
    ).then((rewards) => {
      const result = [];
      for (const [i, reward] of rewards.entries()) {
        result[toFetch[i][0]] = reward ? BI.from(reward) : null;
      }
      setWithdrawnCellRewards(result);
    });
  }, [buildingPacket, setWithdrawnCellRewards]);

  return withdrawnCellRewards;
}
