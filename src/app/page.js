import { useConfig } from "@/lib/config";
import RootHeader from "./header";
import Disclaimer from "./disclaimer.js";

export default function RootPage({ config }) {
  config = config ?? useConfig();
  return (
    <main>
      <Disclaimer />
      <RootHeader config={config} />
    </main>
  );
}
