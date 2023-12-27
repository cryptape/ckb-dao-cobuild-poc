import { Suspense } from "react";
import Assets, { AssetsFallback } from "./assets";
import AccountHeader from "./account-header";

export default function Account({ params: { address } }) {
  return (
    <>
      <header>
        <AccountHeader address={address} />
      </header>
      <main>
        <Suspense fallback={<AssetsFallback />}>
          <Assets address={address} />
        </Suspense>
      </main>
    </>
  );
}
