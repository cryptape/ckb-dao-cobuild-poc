import { configFromEnv } from "@/lib/config";
import Assets from "./assets";

async function fetchHtml() {
  const resp = await fetch("http://localhost:3000/");
  return await resp.text();
}

export default async function Account({ params: { address } }) {
  const config = configFromEnv(process.env);
  const props = { config, address };

  return <Assets {...props} />;
}
