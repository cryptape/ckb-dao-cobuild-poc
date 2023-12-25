import { configFromEnv } from "@/lib/config";

import TransferForm from "./form";

export default function Transfer({ params: { address } }) {
  return (
    <section>
      <h2>Transfer</h2>
      <TransferForm address={address} />
    </section>
  );
}
