"use server";

import { cache } from "react";
import { useConfig } from "@/lib/config";
import { fetchAssets as fetchAssetsWithConfig } from "@/lib/cobuild/assets-manager";

export async function fetchAssetsWithoutCache(address, config) {
  config = config ?? useConfig();
  return await fetchAssetsWithConfig(address, config);
}

export const fetchAssetsWithCache = cache(fetchAssetsWithoutCache);
