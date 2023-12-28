import { useConfig } from "@/lib/config";

import WithdrawForm from "./form";

export default function Withdraw({
  params: { address, txHash, index },
  config,
}) {
  config = config ?? useConfig();

  const outPoint = {
    txHash: `0x${txHash}`,
    index: `0x${index.toString(16)}`,
  };

  const childProps = { address, outPoint, config };

  return (
    <main>
      <h2>Withdraw</h2>
      <WithdrawForm {...childProps} />
    </main>
  );
}
