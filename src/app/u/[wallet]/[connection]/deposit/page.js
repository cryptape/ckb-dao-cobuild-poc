import { getConfig } from "@/lib/config";
import * as walletSelector from "@/lib/wallet/selector";

import DepositForm from "./form";

export default function Deposit({ params: { wallet, connection }, config }) {
  config = config ?? getConfig();
  const address = walletSelector.address(
    wallet,
    connection,
    config.ckbChainConfig,
  );

  return (
    <main>
      <h2>Deposit</h2>
      <DepositForm
        wallet={wallet}
        connection={connection}
        address={address}
        config={config}
      />
    </main>
  );
}
