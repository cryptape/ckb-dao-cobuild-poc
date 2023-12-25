"use server";

import { configFromEnv } from "@/lib/config";
import { fetchAssets as innerFetchAssets } from "@/lib/cobuild/assets-manager";

export default async function fetchAssets(address, config) {
  config = config ?? configFromEnv(process.env);
  return await innerFetchAssets(address, config);
}
