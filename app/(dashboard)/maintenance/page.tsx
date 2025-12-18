import { getAllMaintenances, updateMaintenanceStatus, assignMaintenanceToTechnician, getTechnicians } from "@/lib/actions/maintenance";
import { MaintenancesPageClient } from "./_components/MaintenancesPageClient";
import { MaintenanceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export default async function MaintenancesPage() {
  const maintenances = await getAllMaintenances();

  const handleUpdateStatus = async (id: string, status: MaintenanceStatus) => {
    "use server";
    const result = await updateMaintenanceStatus(id, status);
    if (!result.success) {
      console.error("Failed to update maintenance status:", result.message);
      // Handle error, maybe revalidate path anyway or show a toast
    }
    revalidatePath('/maintenance'); // Revalidate to show updated status
    return result;
  };

  const handleAssignTechnician = async (id: string, assignedToId: string | null) => {
    "use server";
    const result = await assignMaintenanceToTechnician(id, assignedToId);
    if (!result.success) {
      console.error("Failed to assign technician:", result.message);
      // Handle error
    }
    revalidatePath('/maintenance'); // Revalidate to show updated assignment
    return result;
  };

  return (
    <MaintenancesPageClient
      maintenances={maintenances}
      onUpdateStatus={handleUpdateStatus}
      onAssignTechnician={handleAssignTechnician}
      onGetTechnicians={getTechnicians} // Pass the server action directly
    />
  );
}
