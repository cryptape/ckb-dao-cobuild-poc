import { useConfig } from "@/lib/config";

import TransferForm from "./form";

export default function Transfer({ params: { address }, config }) {
  config = config ?? useConfig();

  return (
    <main>
      <h2>Transfer</h2>
      <TransferForm address={address} config={config} />
    </main>
  );
}
