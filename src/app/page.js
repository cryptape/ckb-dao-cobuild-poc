import { useConfig } from "@/lib/config";
import RootHeader from "./header";

export default function RootPage({ config }) {
  config = config ?? useConfig();
  return (
    <main>
      <RootHeader config={config} />
    </main>
  );
}
