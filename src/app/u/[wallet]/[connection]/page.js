import { Suspense } from "react";
import { getConfig } from "@/lib/config";
import * as walletSelector from "@/lib/wallet/selector";
import Assets, { AssetsFallback } from "./assets";
import AccountHeader from "./account-header";

export default function Account({ params: { wallet, connection }, config }) {
  config = config ?? getConfig();
  const address = walletSelector.address(
    wallet,
    connection,
    config.ckbChainConfig,
  );

  return (
    <>
      <header>
        <AccountHeader
          wallet={wallet}
          connection={connection}
          address={address}
          config={config}
        />
      </header>
      <main>
        <Suspense fallback={<AssetsFallback />}>
          <Assets wallet={wallet} connection={connection} address={address} />
        </Suspense>
      </main>
    </>
  );
}
