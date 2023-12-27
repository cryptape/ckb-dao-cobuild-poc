import { configFromEnv } from "@/lib/config";

import DepositForm from "./form";

export default function Deposit({ params: { address }, config }) {
  config = config ?? configFromEnv(process.env);

  return (
    <main>
      <h2>Deposit</h2>
      <DepositForm address={address} config={config} />
    </main>
  );
}
