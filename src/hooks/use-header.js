import { useEffect, useState } from "react";
import { getHeaderWithCache } from "@/actions/get-header";

export default function useHeader(blockHash) {
  const [blockHeader, setBlockHeader] = useState();

  useEffect(() => {
    getHeaderWithCache(blockHash).then(setBlockHeader);
  }, [blockHash, setBlockHeader]);

  return blockHeader;
}
