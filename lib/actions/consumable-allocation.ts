// lib/actions/consumable-allocation.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '../prisma';

// Schema for creating/updating a consumable allocation
const consumableAllocationSchema = z.object({
  consumableId: z.string().min(1, "Consumable ID is required."),
  userId: z.string().min(1, "User ID is required."),
  quantity: z.number().min(0.01, "Quantity must be positive."),
  allocatedBy: z.string().min(1, "Allocated By is required."),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  bookingId: z.string().optional(),
  maintenanceId: z.string().optional(),
});

export type ConsumableAllocationFormValues = z.infer<typeof consumableAllocationSchema>;

// CREATE Consumable Allocation
export async function createConsumableAllocation(values: ConsumableAllocationFormValues) {
  try {
    const newAllocation = await prisma.consumableAllocation.create({
      data: {
        ...values,
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
    return { success: false, message: error.message || "Failed to create consumable allocation." };
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
export async function updateConsumableAllocation(id: string, values: ConsumableAllocationFormValues) {
  try {
    const originalAllocation = await prisma.consumableAllocation.findUnique({
      where: { id },
      select: { quantity: true, consumableId: true },
    });

    if (!originalAllocation) {
      return { success: false, message: "Original allocation not found." };
    }

    const quantityDifference = Number(values.quantity) - originalAllocation.quantity;

    const updatedAllocation = await prisma.consumableAllocation.update({
      where: { id },
      data: {
        ...values,
        quantity: Number(values.quantity),
      },
    });

    // Update consumable stock based on quantity difference
    await prisma.consumable.update({
      where: { id: values.consumableId },
      data: {
        currentStock: {
          decrement: quantityDifference, // Decrement if quantity increased, increment if decreased
        },
      },
    });

    revalidatePath('/consumables/allocations');
    revalidatePath(`/consumables/${values.consumableId}`);
    return { success: true, data: updatedAllocation };
  } catch (error: any) {
    console.error("Error updating consumable allocation:", error);
    return { success: false, message: error.message || "Failed to update consumable allocation." };
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
        allocationDate: 'desc',
      },
    });
    return allocations;
  } catch (error: any) {
    console.error("Error fetching all consumable allocations:", error);
    return [];
  }
}
