import { configFromEnv } from "@/lib/config";
import RootHeader from "./header";

export default function RootPage({ config }) {
  config = config ?? configFromEnv(process.env);
  return <RootHeader config={config} />;
}
