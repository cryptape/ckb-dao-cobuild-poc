import { getConfig } from "@/lib/config";
import Connector from "./connector";
import Disclaimer from "./disclaimer.js";

export default function RootPage({ config }) {
  config = config ?? getConfig();
  return (
    <main>
      <Disclaimer config={config} />
      <Connector config={config} />
    </main>
  );
}
