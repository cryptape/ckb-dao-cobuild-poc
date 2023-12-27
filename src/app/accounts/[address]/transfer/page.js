import { configFromEnv } from "@/lib/config";

import TransferForm from "./form";

export default function Transfer({ params: { address }, config }) {
  config = config ?? configFromEnv(process.env);

  return (
    <main>
      <h2>Transfer</h2>
      <TransferForm address={address} config={config} />
    </main>
  );
}