import { useConfig } from "@/lib/config";
import Connector from "./connector";
import Disclaimer from "./disclaimer.js";

export default function RootPage({ config }) {
  config = config ?? useConfig();
  return (
    <main>
      <Disclaimer config={config} />
      <Connector config={config} />
    </main>
  );
}
