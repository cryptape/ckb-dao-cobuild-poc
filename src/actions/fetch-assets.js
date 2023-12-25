"use server";

import { configFromEnv } from "@/lib/config";
import { fetchAssets as innerFetchAssets } from "@/lib/cobuild/assets-manager";

export default async function fetchAssets(address) {
  const config = configFromEnv(process.env);
  return await innerFetchAssets(config, address);
}
