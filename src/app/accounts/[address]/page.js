import { Suspense } from "react";
import { useConfig } from "@/lib/config";
import Assets, { AssetsFallback } from "./assets";
import AccountHeader from "./account-header";

export default function Account({ params: { address }, config }) {
  config = config ?? useConfig();

  return (
    <>
      <header>
        <AccountHeader address={address} config={config} />
      </header>
      <main>
        <Suspense fallback={<AssetsFallback />}>
          <Assets address={address} />
        </Suspense>
      </main>
    </>
  );
}
