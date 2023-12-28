import { useConfig } from "@/lib/config";

import ClaimForm from "./form";

export default function Claim({ params: { address, txHash, index }, config }) {
  config = config ?? useConfig();

  const outPoint = {
    txHash: `0x${txHash}`,
    index: `0x${index.toString(16)}`,
  };

  const childProps = { address, outPoint, config };

  return (
    <main>
      <h2>Claim</h2>
      <ClaimForm {...childProps} />
    </main>
  );
}
