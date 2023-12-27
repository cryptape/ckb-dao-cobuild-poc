import { useEffect, useState } from "react";
import { getCellWithCache } from "@/actions/get-cell";

export default function useCell(outPoint) {
  const [cell, setCell] = useState();

  useEffect(() => {
    getCellWithCache(outPoint).then(setCell);
  }, [outPoint, setCell]);

  return cell;
}
