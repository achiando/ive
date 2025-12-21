import { getAllConsumables, getEquipmentList } from "@/lib/actions/consumable"; // Import consumable actions
import { getMaintenanceById, getTechnicians } from "@/lib/actions/maintenance";
import { authOptions } from "@/lib/auth";
import { MaintenanceWithRelations } from "@/types/maintenance";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { MaintenanceForm } from "../_components/MaintenanceForm";

interface MaintenancePageProps {
  params: {
    id: string;
  };
  searchParams?: {
    equipmentId?: string;
  };
}

export default async function MaintenancePage({ params, searchParams }: MaintenancePageProps) {
  const { id } = await params;
  const searchParamsObj = await searchParams;
  const equipmentIdFromParams = searchParamsObj?.equipmentId;
  

  const session = await getServerSession(authOptions);
  const createdById = session?.user?.id;

  if (!createdById) {
    redirect("/login"); // Redirect to login if user is not authenticated
  }

  const isNewMaintenance = id === 'new';
  const maintenanceData = isNewMaintenance ? null : await getMaintenanceById(id);

  if (!isNewMaintenance && !maintenanceData) {
    return <div>Maintenance record not found.</div>;
  }

  // Fetch all necessary data for the form
  const [equipmentList, consumableList, technicianList] = await Promise.all([
    getEquipmentList(),
    getAllConsumables(),
    getTechnicians(),
  ]);


  const handleSubmitSuccess = async () => {
    "use server"; // This is already a server component, so this is redundant but harmless
    redirect("/maintenance");
  };

const initialData: MaintenanceWithRelations | undefined = maintenanceData ? {
  ...maintenanceData,
  startDate: new Date(maintenanceData.startDate),
  endDate: maintenanceData.endDate ? new Date(maintenanceData.endDate) : null, // Changed undefined to null
  consumableAllocations: maintenanceData.consumableAllocations.map(alloc => ({
    id: alloc.id,
    maintenanceId: alloc.maintenanceId || '',
    consumableId: alloc.consumableId,
    quantity: alloc.quantity,
    consumable: alloc.consumable,
  })),
} : undefined;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        {isNewMaintenance ? "Schedule New Maintenance" : "Edit Maintenance Record"}
      </h1>
      <MaintenanceForm
        initialData={initialData}
        onSubmitSuccess={handleSubmitSuccess}
        equipmentIdFromParams={equipmentIdFromParams}
        equipmentList={equipmentList} // Pass fetched data
        consumableList={consumableList} // Pass fetched data
        technicianList={technicianList} // Pass fetched data
        session={session}
      />
    </div>
  );
}
