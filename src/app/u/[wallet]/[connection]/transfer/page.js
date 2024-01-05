import { getConfig } from "@/lib/config";
import * as walletSelector from "@/lib/wallet/selector";

import TransferForm from "./form";

export default function Transfer({ params: { wallet, connection }, config }) {
  config = config ?? getConfig();
  const address = walletSelector.address(
    wallet,
    connection,
    config.ckbChainConfig,
  );

  return (
    <main>
      <h2>Transfer</h2>
      <TransferForm
        wallet={wallet}
        connection={connection}
        address={address}
        config={config}
      />
    </main>
  );
}
