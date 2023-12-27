import { useEffect, useState } from "react";
import { getTipHeaderWithoutCache } from "@/actions/get-tip-header";

export default function useTipHeader() {
  const [tipHeader, setTipHeader] = useState();
  const fn = () => {
    getTipHeaderWithoutCache().then(setTipHeader);
  };

  useEffect(() => {
    fn();
    const handle = setInterval(fn, 12000);
    return () => {
      clearInterval(handle);
    };
  }, [setTipHeader]);

  return tipHeader;
}
