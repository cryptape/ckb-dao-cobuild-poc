import { Suspense } from "react";
import { configFromEnv } from "@/lib/config";
import Assets from "./assets";
import Loading from "./loading";
import AccountHeader from "./account-header";

export default function Account({ params: { address } }) {
  return (
    <>
      <header>
        <AccountHeader address={address} />
      </header>
      <section>
        <h2>CKB</h2>
        <Suspense fallback={<Loading />}>
          <Assets address={address} />
        </Suspense>
      </section>
    </>
  );
}
