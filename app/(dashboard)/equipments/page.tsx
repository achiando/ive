import { getEquipments } from "@/lib/actions/equipment";
import { Metadata } from "next";
import { EquipmentsPageClient } from "./_components/EquipmentsPageClient";

export const metadata: Metadata = {
  title: "CDIE Equipments",
  description: "CDIE Equipments",
};

export default async function EquipmentsPage() {
  const equipments = await getEquipments();

  return <EquipmentsPageClient equipments={equipments} />;
}
