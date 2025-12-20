// lib/actions/consumable.ts
'use server';


import { ConsumableCategory } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '../prisma';

// Schema for creating/updating a consumable
const consumableSchema = z.object({
  name: z.string().min(1, "Consumable name is required."),
  description: z.string().optional(),
  category: z.nativeEnum(ConsumableCategory),
  unit: z.string().min(1, "Unit of measurement is required."),
  currentStock: z.number().min(0, "Current stock cannot be negative."),
  minimumStock: z.number().min(0, "Minimum stock cannot be negative."),
  unitCost: z.number().min(0, "Unit cost cannot be negative.").optional(),
  location: z.string().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
  image: z.string().optional(), // URL of the image
  equipmentIds: z.array(z.string()).optional(), // IDs of associated equipment
});

export type ConsumableFormValues = z.infer<typeof consumableSchema>;

// Helper function to handle image upload (if needed, currently placeholder)
async function handleImageUpload(imageFile: File | undefined): Promise<string | undefined> {
  if (!imageFile) return undefined;
  // TODO: Implement actual image upload logic to a storage service (e.g., Supabase Storage)
  // For now, return a placeholder URL or handle as needed
  console.log("Simulating image upload for:", imageFile.name);
  return `/uploads/${imageFile.name}`; // Placeholder
}

// CREATE Consumable
export async function createConsumable(values: ConsumableFormValues) {
  try {
    // Handle image upload if a file is provided
    // const imageUrl = await handleImageUpload(values.imageFile); // Assuming imageFile is part of values

    const { equipmentIds, ...data } = values;

    // In your createConsumable function, modify the data object to include quantity:
    const newConsumable = await prisma.consumable.create({
      data: {
        ...data,
        quantity: Number(data.currentStock), // Add this line
        currentStock: Number(data.currentStock),
        minimumStock: Number(data.minimumStock),
        unitCost: data.unitCost ? Number(data.unitCost) : null,
        equipment: {
          connect: equipmentIds?.map(id => ({ id })) || [],
        },
      },
    });

    revalidatePath('/consumables');
    return { success: true, data: newConsumable };
  } catch (error: any) {
    console.error("Error creating consumable:", error);
    return { success: false, message: error.message || "Failed to create consumable." };
  }
}

// GET Consumable by ID
export async function getConsumableById(id: string) {
  try {
    const consumable = await prisma.consumable.findUnique({
      where: { id },
      include: {
        equipment: {
          select: { id: true, name: true },
        },
      },
    });
    return consumable;
  } catch (error: any) {
    console.error("Error fetching consumable by ID:", error);
    return null;
  }
}

// UPDATE Consumable
export async function updateConsumable(id: string, values: ConsumableFormValues) {
  try {
    // Handle image upload if a file is provided
    // const imageUrl = await handleImageUpload(values.imageFile); // Assuming imageFile is part of values

    const { equipmentIds, ...data } = values;

    const updatedConsumable = await prisma.consumable.update({
      where: { id },
      data: {
        ...data,
        currentStock: Number(data.currentStock),
        minimumStock: Number(data.minimumStock),
        unitCost: data.unitCost ? Number(data.unitCost) : null,
        // image: imageUrl || data.image, // Use new URL or existing one
        equipment: {
          set: equipmentIds?.map(eqId => ({ id: eqId })) || [], // Disconnect all and reconnect selected
        },
      },
    });

    revalidatePath('/consumables');
    revalidatePath(`/consumables/${id}`);
    return { success: true, data: updatedConsumable };
  } catch (error: any) {
    console.error("Error updating consumable:", error);
    return { success: false, message: error.message || "Failed to update consumable." };
  }
}

// DELETE Consumable
export async function deleteConsumable(id: string) {
  try {
    await prisma.consumable.delete({
      where: { id },
    });
    revalidatePath('/consumables');
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting consumable:", error);
    return { success: false, message: error.message || "Failed to delete consumable." };
  }
}

// GET All Consumables
export async function getAllConsumables() {
  try {
    const consumables = await prisma.consumable.findMany({
      include: {
        equipment: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return consumables;
  } catch (error: any) {
    console.error("Error fetching all consumables:", error);
    return [];
  }
}

// GET Equipment List (for associating consumables)
export async function getEquipmentList() {
  try {
    const equipment = await prisma.equipment.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return equipment;
  } catch (error: any) {
    console.error("Error fetching equipment list:", error);
    return [];
  }
}
