export default function BuildingPacketReview({
  buildingPacket,
  lockActionData,
}) {
  const { message, payload, resolvedInputs } = buildingPacket.value;

  return (
    <pre>
      {JSON.stringify(
        { message, payload, resolvedInputs, lockActionData },
        null,
        2,
      )}
    </pre>
  );
}
