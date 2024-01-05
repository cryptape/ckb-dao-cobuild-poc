import { useConfig } from "@/lib/config";
import * as walletSelector from "@/lib/wallet/selector";

import WithdrawForm from "./form";

export default function Withdraw({
  params: { wallet, connection, txHash, index },
  config,
}) {
  config = config ?? useConfig();
  const address = walletSelector.address(
    wallet,
    connection,
    config.ckbChainConfig,
  );

  const outPoint = {
    txHash: `0x${txHash}`,
    index: `0x${index.toString(16)}`,
  };

  const childProps = { wallet, connection, address, outPoint, config };

  return (
    <main>
      <h2>Withdraw</h2>
      <WithdrawForm {...childProps} />
    </main>
  );
}
