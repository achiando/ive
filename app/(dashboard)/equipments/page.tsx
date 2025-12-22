import { getEquipments } from "@/lib/actions/equipment";
import { Metadata } from "next";
import { EquipmentsPageClient } from "./_components/EquipmentsPageClient";
import { getServerSession } from "next-auth"; // Import getServerSession
import { authOptions } from "@/lib/auth"; // Import authOptions
import { EquipmentStatus, EquipmentWithRelations } from "@/types/equipment"; // Import EquipmentStatus and EquipmentWithRelations
import { UserRole } from "@prisma/client"; // Import UserRole

export const metadata: Metadata = {
  title: "CDIE Equipments",
  description: "CDIE Equipments",
};

export default async function EquipmentsPage() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole | undefined;

  let equipments = await getEquipments();

  // Filter equipment based on user role
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.TECHNICIAN) {
    equipments = equipments.filter(
      (equipment: EquipmentWithRelations) =>
        equipment.status !== EquipmentStatus.IN_USE &&
        equipment.status !== EquipmentStatus.OUT_OF_SERVICE &&
        equipment.status !== EquipmentStatus.MAINTENANCE
    );
  }

  return <EquipmentsPageClient equipments={equipments} userRole={userRole} />;
}