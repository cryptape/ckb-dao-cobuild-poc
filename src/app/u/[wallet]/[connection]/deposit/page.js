import { useConfig } from "@/lib/config";
import * as walletSelector from "@/lib/wallet/selector";

import DepositForm from "./form";

export default function Deposit({ params: { wallet, connection }, config }) {
  config = config ?? useConfig();
  const address = walletSelector.address(
    wallet,
    connection,
    config.ckbChainConfig,
  );

  return (
    <main>
      <h2>Deposit</h2>
      <DepositForm address={address} config={config} />
    </main>
  );
}
