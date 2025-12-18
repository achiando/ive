import { EquipmentsPageClient } from "./_components/EquipmentsPageClient";
import { getEquipments } from "@/lib/actions/equipment";

export default async function EquipmentsPage() {
  const equipments = await getEquipments();

  return <EquipmentsPageClient equipments={equipments} />;
}
