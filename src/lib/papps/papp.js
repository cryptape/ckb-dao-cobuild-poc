function newBuildingPacket() {
  return {
    type: "BuildingPacketV1",
    value: {
      message: {
        actions: [],
      },
      scriptInfos: [],
      lockActions: [],
      payload: {
        version: 0,
        inputs: [],
        outputs: [],
        outputsData: [],
        cellDeps: [],
        headerDeps: [],
        witnesses: [],
      },
      resolvedInputs: {
        outputs: [],
        outputsData: [],
      },
      changeOutput: undefined,
    },
  };
}

export async function createBuildingPacketByFormDataCreator(
  papp,
  creatorName,
  formData,
) {
  const actionData = papp.formDataCreators[creatorName](formData);
  const buildingPacket = newBuildingPacket();
  let callback = papp.callbacks.willAddAction;

  return await callback(buildingPacket, actionData);
}

export async function createBuildingPacketByCreator(
  papp,
  creatorName,
  ...creatorArgs
) {
  const actionData = papp.creators[creatorName](...creatorArgs);
  const buildingPacket = newBuildingPacket();
  let callback = papp.callbacks.willAddAction;

  return await callback(buildingPacket, actionData);
}
