// A Publisher emits BuildingPacket.
//
// (config) => async (params) => BuildingPacket

import createLumosCkbBuilder from "@/lib/lumos-adapter/create-lumos-ckb-builder";

export function transferCkb(config) {
  return createLumosCkbBuilder(config).transferCkb;
}

export function reclaimDaoVerifiers(config) {
  return createLumosCkbBuilder(config).reclaimDaoVerifiers;
}

export function depositDao(config) {
  return createLumosCkbBuilder(config).depositDao;
}

export function withdrawDao(config) {
  return createLumosCkbBuilder(config).withdrawDao;
}

export function claimDao(config) {
  return createLumosCkbBuilder(config).claimDao;
}
