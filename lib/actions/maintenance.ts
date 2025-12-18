// lib/actions/maintenance.ts
'use server';

import { MaintenanceOrderState, MaintenanceStatus, MaintenanceType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '../prisma';

// Schema for creating/updating a maintenance record
const maintenanceSchema = z.object({
  equipmentId: z.string().min(1, "Equipment ID is required."),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.nativeEnum(MaintenanceStatus),
  type: z.nativeEnum(MaintenanceType),
  orderStatus: z.nativeEnum(MaintenanceOrderState),
  notes: z.string().optional(),
  assignedToId: z.string().optional(), // User ID of the assigned technician
  createdById: z.string().min(1, "Creator ID is required."), // User ID of the creator
  consumableAllocations: z.array(
    z.object({
      consumableId: z.string().min(1, 'Consumable ID is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
    })
  ).optional(),
});

export type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

// CREATE Maintenance
export async function createMaintenance(values: MaintenanceFormValues) {
  try {
    const { consumableAllocations, ...data } = values;

    const newMaintenance = await prisma.maintenance.create({
      data: {
        ...data,
        startDate: data.startDate,
        endDate: data.endDate || null,
        assignedToId: data.assignedToId || null,
        consumableAllocations: {
          create: consumableAllocations?.map(alloc => ({
            consumable: { connect: { id: alloc.consumableId } },
            quantity: alloc.quantity,
            allocatedBy: data.createdById, // The user who created the maintenance is the one allocating
            userId: data.createdById,      // Add this line to include the required userId
            purpose: `Maintenance for equipment ${data.equipmentId}`,
          })) || [],
        }
      },
    });

    // Update consumable stock for each allocation
    if (consumableAllocations && consumableAllocations.length > 0) {
      for (const alloc of consumableAllocations) {
        await prisma.consumable.update({
          where: { id: alloc.consumableId },
          data: {
            currentStock: {
              decrement: alloc.quantity,
            },
          },
        });
      }
    }

    revalidatePath('/maintenance');
    revalidatePath(`/equipments/${values.equipmentId}/view`);
    return { success: true, data: newMaintenance };
  } catch (error: any) {
    console.error("Error creating maintenance:", error);
    return { success: false, message: error.message || "Failed to create maintenance." };
  }
}

// GET Maintenance by ID
export async function getMaintenanceById(id: string) {
  try {
    const maintenance = await prisma.maintenance.findUnique({
      where: { id },
      include: {
        equipment: {
          select: { id: true, name: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        consumableAllocations: {
          include: {
            consumable: {
              select: { id: true, name: true, unit: true },
            },
          },
        },
      },
    });
    return maintenance;
  } catch (error: any) {
    console.error("Error fetching maintenance by ID:", error);
    return null;
  }
}

// UPDATE Maintenance
export async function updateMaintenance(id: string, values: MaintenanceFormValues) {
  try {
    const { consumableAllocations, ...data } = values;

    // Fetch existing allocations to calculate stock differences
    const existingAllocations = await prisma.consumableAllocation.findMany({
      where: { maintenanceId: id },
    });

    // Determine allocations to create, update, or delete
    const allocationsToCreate = consumableAllocations?.filter(
      (newAlloc) => !existingAllocations.some((existingAlloc) => existingAlloc.consumableId === newAlloc.consumableId)
    ) || [];

    const allocationsToUpdate = consumableAllocations?.filter((newAlloc) =>
      existingAllocations.some((existingAlloc) => existingAlloc.consumableId === newAlloc.consumableId)
    ) || [];

    const allocationsToDelete = existingAllocations.filter(
      (existingAlloc) => !consumableAllocations?.some((newAlloc) => newAlloc.consumableId === existingAlloc.consumableId)
    );

    // Handle deletions (increment stock back)
    for (const alloc of allocationsToDelete) {
      await prisma.consumable.update({
        where: { id: alloc.consumableId },
        data: { currentStock: { increment: alloc.quantity } },
      });
      await prisma.consumableAllocation.delete({ where: { id: alloc.id } });
    }

    // Handle updates (adjust stock based on difference)
    for (const newAlloc of allocationsToUpdate) {
      const existingAlloc = existingAllocations.find(ea => ea.consumableId === newAlloc.consumableId);
      if (existingAlloc) {
        const quantityDifference = newAlloc.quantity - existingAlloc.quantity;
        await prisma.consumable.update({
          where: { id: newAlloc.consumableId },
          data: { currentStock: { decrement: quantityDifference } },
        });
        await prisma.consumableAllocation.update({
          where: { id: existingAlloc.id },
          data: { quantity: newAlloc.quantity },
        });
      }
    }

    // Handle creations (decrement stock)
    for (const alloc of allocationsToCreate) {
      await prisma.consumable.update({
        where: { id: alloc.consumableId },
        data: { currentStock: { decrement: alloc.quantity } },
      });
      await prisma.consumableAllocation.create({
        data: {
          consumable: { connect: { id: alloc.consumableId } },
          quantity: alloc.quantity,
          allocatedBy: data.createdById,
          purpose: `Maintenance for equipment ${data.equipmentId}`,
          maintenance: { connect: { id } },
          userId: data.createdById,
        },
      });
    }

    const updatedMaintenance = await prisma.maintenance.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate,
        endDate: data.endDate || null,
        assignedToId: data.assignedToId || null,
      },
    });

    revalidatePath('/maintenance');
    revalidatePath(`/maintenance/${id}`);
    revalidatePath(`/equipments/${values.equipmentId}/view`);
    return { success: true, data: updatedMaintenance };
  } catch (error: any) {
    console.error("Error updating maintenance:", error);
    return { success: false, message: error.message || "Failed to update maintenance." };
  }
}

// DELETE Maintenance
export async function deleteMaintenance(id: string) {
  try {
    // Before deleting maintenance, return allocated consumables to stock
    const allocations = await prisma.consumableAllocation.findMany({
      where: { maintenanceId: id },
    });

    for (const alloc of allocations) {
      await prisma.consumable.update({
        where: { id: alloc.consumableId },
        data: { currentStock: { increment: alloc.quantity } },
      });
    }

    await prisma.consumableAllocation.deleteMany({
      where: { maintenanceId: id },
    });

    await prisma.maintenance.delete({
      where: { id },
    });
    revalidatePath('/maintenance');
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting maintenance:", error);
    return { success: false, message: error.message || "Failed to delete maintenance." };
  }
}

// GET All Maintenances
export async function getAllMaintenances() {
  try {
    const maintenances = await prisma.maintenance.findMany({
      include: {
        equipment: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        consumableAllocations: {
          include: {
            consumable: {
              select: { id: true, name: true, unit: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return maintenances;
  } catch (error: any) {
    console.error("Error fetching all maintenances:", error);
    return [];
  }
}

// GET Users for assignment (e.g., technicians)
export async function getTechnicians() {
  try {
    const technicians = await prisma.user.findMany({
      where: {
        role: {
          in: ['TECHNICIAN', 'ADMIN_TECHNICIAN', 'LAB_MANAGER'],
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    });
    return technicians;
  } catch (error: any) {
    console.error("Error fetching technicians:", error);
    return [];
  }
}

// UPDATE Maintenance Status
export async function updateMaintenanceStatus(id: string, status: MaintenanceStatus) {
  try {
    const updatedMaintenance = await prisma.maintenance.update({
      where: { id },
      data: { status },
    });
    revalidatePath('/maintenance');
    revalidatePath(`/maintenance/${id}`);
    return { success: true, data: updatedMaintenance };
  } catch (error: any) {
    console.error("Error updating maintenance status:", error);
    return { success: false, message: error.message || "Failed to update maintenance status." };
  }
}

// ASSIGN Maintenance to Technician
export async function assignMaintenanceToTechnician(id: string, assignedToId: string | null) {
  try {
    const updatedMaintenance = await prisma.maintenance.update({
      where: { id },
      data: { assignedToId },
    });
    revalidatePath('/maintenance');
    revalidatePath(`/maintenance/${id}`);
    return { success: true, data: updatedMaintenance };
  } catch (error: any) {
    console.error("Error assigning maintenance to technician:", error);
    return { success: false, message: error.message || "Failed to assign maintenance to technician." };
  }
}
