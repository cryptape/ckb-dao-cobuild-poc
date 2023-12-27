import { useEffect, useState } from "react";
import { getHeaderByNumberWithCache } from "@/actions/get-header-by-number";

export default function useHeaderByNumber(blockNumber) {
  const [blockHeader, setBlockHeader] = useState();

  useEffect(() => {
    getHeaderByNumberWithCache(blockNumber).then(setBlockHeader);
  }, [blockNumber, setBlockHeader]);

  return blockHeader;
}
