"use server"
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client'; // Import UserRole
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '../prisma';

// Schema for creating/updating a consumable allocation
const consumableAllocationSchema = z.object({
  consumableId: z.string().min(1, "Consumable ID is required."),
  quantity: z.number().min(0.01, "Quantity must be positive."),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  bookingId: z.string().optional().nullable(), // Added nullable
  maintenanceId: z.string().optional().nullable(), // Added nullable
  allocationDate: z.date(), // Added allocationDate
});

export type ConsumableAllocationFormValues = z.infer<typeof consumableAllocationSchema>;

interface UpdateConsumableAllocationData {
  consumableId?: string;
  quantity?: number;
  purpose?: string;
  notes?: string;
  bookingId?: string | null;
  maintenanceId?: string | null;
  allocationDate?: Date;
}

// CREATE Consumable Allocation
export async function createConsumableAllocation(values: ConsumableAllocationFormValues) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  const userId = session.user.id;
  const allocatedBy = session.user.name || session.user.email || 'Unknown User';

  try {
    const newAllocation = await prisma.consumableAllocation.create({
      data: {
        ...values,
        userId,
        allocatedBy,
        quantity: Number(values.quantity),
      },
    });

    // TODO: Update consumable stock here
    await prisma.consumable.update({
      where: { id: values.consumableId },
      data: {
        currentStock: {
          decrement: Number(values.quantity),
        },
      },
    });

    revalidatePath('/consumables/allocations');
    revalidatePath(`/consumables/${values.consumableId}`);
    return { success: true, data: newAllocation };
  } catch (error: any) {
    console.error("Error creating consumable allocation:", error);
    throw new Error(error.message || "Failed to create consumable allocation.");
  }
}

// GET Consumable Allocation by ID
export async function getConsumableAllocationById(id: string) {
  try {
    const allocation = await prisma.consumableAllocation.findUnique({
      where: { id },
      include: {
        consumable: {
          select: { id: true, name: true, unit: true },
        },
      },
    });
    return allocation;
  } catch (error: any) {
    console.error("Error fetching consumable allocation by ID:", error);
    return null;
  }
}

// UPDATE Consumable Allocation
export async function updateConsumableAllocation(id: string, values: UpdateConsumableAllocationData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  const user = session.user as { id: string; role: UserRole };

  try {
    const originalAllocation = await prisma.consumableAllocation.findUnique({
      where: { id },
      select: { quantity: true, consumableId: true, userId: true }, // Select userId for auth
    });

    if (!originalAllocation) {
      return { success: false, message: "Original allocation not found." };
    }

    // Authorization check: Only allow update by the user who made the allocation or an admin/manager/technician
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.LAB_MANAGER, UserRole.ADMIN_TECHNICIAN, UserRole.TECHNICIAN];
    const hasAccess = originalAllocation.userId === user.id || allowedRoles.includes(user.role);

    if (!hasAccess) {
      throw new Error('Forbidden: You do not have permission to update this allocation.');
    }

    const quantityDifference = (values.quantity !== undefined ? Number(values.quantity) : originalAllocation.quantity) - originalAllocation.quantity;

    const updatedAllocation = await prisma.consumableAllocation.update({
      where: { id },
      data: {
        ...values,
        quantity: values.quantity !== undefined ? Number(values.quantity) : undefined,
      },
    });

    // Update consumable stock based on quantity difference
    if (quantityDifference !== 0) {
      await prisma.consumable.update({
        where: { id: originalAllocation.consumableId }, // Use original consumableId for stock adjustment
        data: {
          currentStock: {
            decrement: quantityDifference, // Decrement if quantity increased, increment if decreased
          },
        },
      });
    }

    revalidatePath('/consumables/allocations');
    revalidatePath(`/consumables/${originalAllocation.consumableId}`); // Revalidate original consumable path
    if (values.consumableId && values.consumableId !== originalAllocation.consumableId) {
      revalidatePath(`/consumables/${values.consumableId}`); // Revalidate new consumable path if changed
    }
    return { success: true, data: updatedAllocation };
  } catch (error: any) {
    console.error("Error updating consumable allocation:", error);
    throw new Error(error.message || "Failed to update consumable allocation.");
  }
}

// DELETE Consumable Allocation
export async function deleteConsumableAllocation(id: string) {
  try {
    const deletedAllocation = await prisma.consumableAllocation.delete({
      where: { id },
    });

    // Increment consumable stock back
    await prisma.consumable.update({
      where: { id: deletedAllocation.consumableId },
      data: {
        currentStock: {
          increment: deletedAllocation.quantity,
        },
      },
    });

    revalidatePath('/consumables/allocations');
    revalidatePath(`/consumables/${deletedAllocation.consumableId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting consumable allocation:", error);
    return { success: false, message: error.message || "Failed to delete consumable allocation." };
  }
}

// GET All Consumable Allocations
export async function getAllConsumableAllocations() {
  try {
    const allocations = await prisma.consumableAllocation.findMany({
      include: {
        consumable: {
          select: { id: true, name: true, unit: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return allocations;
  } catch (error: any) {
    console.error("Error fetching all consumable allocations:", error);
    return [];
  }
}
