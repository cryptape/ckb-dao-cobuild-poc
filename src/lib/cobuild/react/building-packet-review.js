// TODO: present the buildingPacket
export default function BuildingPacketReview({ buildingPacket }) {
  return <pre>{JSON.stringify(buildingPacket, null, 2)}</pre>;
}
