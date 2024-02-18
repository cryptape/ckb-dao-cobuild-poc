import { getConfig } from "@/lib/config";
import * as walletSelector from "@/lib/wallet/selector";

import ReclaimForm from "./form";

export default function Withdraw({ params: { wallet, connection }, config }) {
  config = config ?? getConfig();
  const address = walletSelector.address(
    wallet,
    connection,
    config.ckbChainConfig,
  );

  const childProps = { wallet, connection, address, config };

  return (
    <main>
      <h2>Reclaim DAO Verifiers</h2>
      <ReclaimForm {...childProps} />
    </main>
  );
}
