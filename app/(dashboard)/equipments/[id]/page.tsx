import { createEquipment, getEquipmentById, updateEquipment } from "@/lib/actions/equipment";
import { redirect } from "next/navigation";
import { EquipmentForm, EquipmentFormValues } from "../_components/EquipmentForm";

// Helper function to transform equipment data to form values
function transformToFormValues(equipment: any): EquipmentFormValues | undefined {
  if (!equipment) return undefined;
  
  // Extract only the fields that match EquipmentFormValues
  const { bookings, maintenances, ...formValues } = equipment;
  return formValues as EquipmentFormValues;
}

interface EquipmentPageProps {
  params: {
    id: string;
  };
}

export default async function EquipmentPage({ params }: EquipmentPageProps) {
  const { id } = await params;

  const isNewEquipment = id === 'new';
  const equipmentData = isNewEquipment ? null : await getEquipmentById(id);

  if (!isNewEquipment && !equipmentData) {
    return <div>Equipment not found.</div>;
  }

  const handleSubmit = async (data: EquipmentFormValues) => {
    "use server";
    
    const dataToSave = { ...data };

    if (isNewEquipment) {
      const result = await createEquipment(dataToSave);
      if (result.success) {
        // toast.success("Equipment created successfully!"); // Client-side toast
        redirect("/equipments");
      } else {
        // toast.error(result.message); // Client-side toast
      }
    } else {
      if (equipmentData) {
        const result = await updateEquipment(equipmentData.id, dataToSave);
        if (result.success) {
          // toast.success("Equipment updated successfully!"); // Client-side toast
          redirect("/equipments");
        } else {
          // toast.error(result.message); // Client-side toast
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        {isNewEquipment ? "Create New Equipment" : "Edit Equipment"}
      </h1>
      <EquipmentForm 
        initialData={equipmentData ? transformToFormValues(equipmentData) : undefined} 
        onSubmit={handleSubmit} 
      />
    </div>
  );
}
