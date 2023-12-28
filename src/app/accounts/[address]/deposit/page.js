import { useConfig } from "@/lib/config";

import DepositForm from "./form";

export default function Deposit({ params: { address }, config }) {
  config = config ?? useConfig();

  return (
    <main>
      <h2>Deposit</h2>
      <DepositForm address={address} config={config} />
    </main>
  );
}
