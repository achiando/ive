import { redirect } from "next/navigation";
import { ConsumableForm, ConsumableFormValues } from "../_components/ConsumableForm";
import { createConsumable, getConsumableById, updateConsumable } from "@/lib/actions/consumable";
import { toast } from "sonner"; // Assuming toast is available for client-side notifications

interface ConsumablePageProps {
  params: {
    id: string;
  };
}

export default async function ConsumablePage({ params }: ConsumablePageProps) {
  const { id } = await params;

  const isNewConsumable = id === 'new';
  const consumableData = isNewConsumable ? null : await getConsumableById(id);

  if (!isNewConsumable && !consumableData) {
    return <div>Consumable not found.</div>;
  }

  const handleSubmit = async (data: ConsumableFormValues) => {
    "use server";
    
    let result;
    if (isNewConsumable) {
      result = await createConsumable(data);
    } else {
      if (consumableData) {
        result = await updateConsumable(consumableData.id, data);
      }
    }

    if (result?.success) {
      // toast.success(`Consumable ${isNewConsumable ? 'created' : 'updated'} successfully!`); // Client-side toast
      redirect("/consumables");
    } else {
      // toast.error(result?.message || `Failed to ${isNewConsumable ? 'create' : 'update'} consumable.`); // Client-side toast
    }
  };

  // Transform consumableData to ConsumableFormValues if it exists
  const initialData = consumableData ? {
    ...consumableData,
    currentStock: consumableData.currentStock,
    minimumStock: consumableData.minimumStock,
    unitCost: consumableData.unitCost ?? undefined,
    equipmentIds: consumableData.equipment.map(eq => eq.id),
  } : undefined;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        {isNewConsumable ? "Create New Consumable" : "Edit Consumable"}
      </h1>
      <ConsumableForm 
        initialData={initialData} 
        onSubmit={handleSubmit} 
        onCancel={() => redirect("/consumables")}
      />
    </div>
  );
}
