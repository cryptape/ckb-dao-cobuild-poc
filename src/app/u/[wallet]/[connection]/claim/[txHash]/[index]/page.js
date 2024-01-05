import { getConfig } from "@/lib/config";
import * as walletSelector from "@/lib/wallet/selector";

import ClaimForm from "./form";

export default function Claim({
  params: { wallet, connection, txHash, index },
  config,
}) {
  config = config ?? getConfig();
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
      <h2>Claim</h2>
      <ClaimForm {...childProps} />
    </main>
  );
}
