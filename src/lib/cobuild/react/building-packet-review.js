export default function BuildingPacketReview({
  buildingPacket,
  lockActionData,
}) {
  const { message, payload } = buildingPacket.value;

  return (
    <pre>{JSON.stringify({ message, payload, lockActionData }, null, 2)}</pre>
  );
}
