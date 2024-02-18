import { useEffect, useState } from "react";
import { getVerifierCellsWithCache } from "@/actions/get-verifier-cells";

export default function useVerifierCells(fromAddress) {
  const [verifierCells, setVerifierCells] = useState();

  useEffect(() => {
    getVerifierCellsWithCache(fromAddress).then(setVerifierCells);
  }, [fromAddress, setVerifierCells]);

  return verifierCells;
}
