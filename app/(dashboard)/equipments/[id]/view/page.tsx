import { Button } from "@/components/ui/button";
import { getEquipmentById, updateEquipmentStatus } from "@/lib/actions/equipment";
import { fetchUserProjects } from "@/lib/actions/project"; // Import the new action
import { EquipmentWithRelations } from "@/types/equipment";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EquipmentView } from "./_components/EquipmentView";

export default async function EquipmentViewPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  if (!id) {
    return (
      <div className="text-center">
        <p className="text-lg font-semibold">Invalid equipment ID</p>
        <Button asChild variant="link">
          <Link href="/equipments">Go back to all equipments</Link>
        </Button>
      </div>
    );
  }

  try {
    const equipmentData = await getEquipmentById(id);

    if (!equipmentData) {
      return (
        <div className="text-center">
          <p className="text-lg font-semibold">Equipment not found</p>
          <Button asChild variant="link">
            <Link href="/equipments">Go back to all equipments</Link>
          </Button>
        </div>
      );
    }

    const handleUpdateStatus = async (equipmentId: string, status: string) => {
      "use server";
      const result = await updateEquipmentStatus(equipmentId, status);
      if (!result.success) {
        console.error("Failed to update equipment status:", result.message);
        // Optionally revalidate path or handle error more gracefully
      }
      redirect(`/equipments/${equipmentId}/view`); // Revalidate and refresh the page
    };

    return <EquipmentView equipment={equipmentData as EquipmentWithRelations} onUpdateStatus={handleUpdateStatus} userRole="ADMIN" fetchUserProjects={fetchUserProjects} />; // Pass the new action
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return (
      <div className="text-center">
        <p className="text-lg font-semibold">Error loading equipment</p>
        <Button asChild variant="link">
          <Link href="/equipments">Go back to all equipments</Link>
        </Button>
      </div>
    );
  }
}
