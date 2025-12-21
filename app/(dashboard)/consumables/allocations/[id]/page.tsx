
import { getBookings } from "@/lib/actions/booking";
import { getAllConsumables } from "@/lib/actions/consumable";
import { createConsumableAllocation, getConsumableAllocationById, updateConsumableAllocation } from "@/lib/actions/consumable-allocation";
import { getAllMaintenances } from "@/lib/actions/maintenance";
import { authOptions } from "@/lib/auth";
import { ConsumableAllocationFormData } from "@/types/consumable";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ConsumableAllocationForm } from "../_components/ConsumableAllocationForm";

interface ConsumableAllocationPageProps {
  params: {
    id: string; // Can be 'new' or an actual ID
  };
  searchParams: {
    bookingId?: string;
    maintenanceId?: string;
  };
}

export default async function ConsumableAllocationPage({ params, searchParams }: ConsumableAllocationPageProps) {
  const { id } = await params;
  const { bookingId, maintenanceId } = await searchParams;
  const isNewAllocation = id === 'new';

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Only allow ADMIN, LAB_MANAGER, ADMIN_TECHNICIAN, TECHNICIAN to create/edit allocations
  const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.LAB_MANAGER, UserRole.ADMIN_TECHNICIAN, UserRole.TECHNICIAN];
  if (!allowedRoles.includes(session.user.role as UserRole)) {
    redirect("/dashboard"); // Redirect to dashboard if not authorized
  }

  let initialAllocation = null;
  if (!isNewAllocation) {
    initialAllocation = await getConsumableAllocationById(id);

    if (!initialAllocation) {
      return (
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold">Consumable Allocation Not Found</h1>
          <p className="text-muted-foreground">The requested consumable allocation could not be found.</p>
        </div>
      );
    }
  }

  const consumables = await getAllConsumables();
  const { data: bookings } = await getBookings({});
  const maintenanceRecords = await getAllMaintenances();

  const handleFormSubmit = async (formData: ConsumableAllocationFormData) => {
    "use server";
    try {
      if (isNewAllocation) {
        const result = await createConsumableAllocation(formData);
        if (!result.success) {
          throw new Error("Failed to create consumable allocation.");
        }
      } else {
        const result = await updateConsumableAllocation(id, formData);
        if (!result.success) {
          throw new Error(result.message || "Failed to update consumable allocation.");
        }
      }
    } catch (error: any) {
      console.error(`Error ${isNewAllocation ? 'creating' : 'updating'} consumable allocation in page.tsx:`, error);
      throw error;
    }
    redirect("/consumables/allocations");
  };

  // Transform initialAllocation to ConsumableAllocationFormData
  const initialData: ConsumableAllocationFormData | undefined = initialAllocation ? {
    consumableId: initialAllocation.consumableId,
    quantity: initialAllocation.quantity,
    purpose: initialAllocation.purpose || '',
    allocatedDate: initialAllocation.createdAt,
    bookingId: initialAllocation.bookingId,
    maintenanceId: initialAllocation.maintenanceId,
  } : (isNewAllocation && (bookingId || maintenanceId)) ? {
    consumableId: '',
    quantity: 1,
    purpose: '',
    allocatedDate: new Date(),
    bookingId: bookingId || null,
    maintenanceId: maintenanceId || null,
  } : undefined;

  return (
    <div className="space-y-8">
      <ConsumableAllocationForm
        initialData={initialData}
        consumables={consumables}
        bookings={bookings}
        maintenanceRecords={maintenanceRecords}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
