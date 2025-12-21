// lib/actions/bulk-consumable.ts
'use server';

import { z } from 'zod';

import { ConsumableCategory, ConsumableStatus } from '@prisma/client'; // Import ConsumableStatus
import { revalidatePath } from 'next/cache';
import { prisma } from '../prisma';

// Define a schema for the incoming bulk data, which should align with ConsumableFormValues
const bulkConsumableSchema = z.object({
  name: z.string().min(1, "Consumable name is required."),
  description: z.string().optional(),
  category: z.nativeEnum(ConsumableCategory),
  unit: z.string().min(1, "Unit of measurement is required."),
  quantity: z.number().int().min(0, "Quantity cannot be negative.").default(0), // Changed to int
  currentStock: z.number().min(0, "Current stock cannot be negative."),
  minimumStock: z.number().min(0, "Minimum stock cannot be negative."),
  unitCost: z.number().min(0, "Unit cost cannot be negative.").optional(),
  location: z.string().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
  image: z.string().optional(), // URL of the image
  status: z.nativeEnum(ConsumableStatus).default(ConsumableStatus.AVAILABLE), // Added status
  expiryDate: z.date().optional(), // Added expiryDate
  // equipmentIds: z.array(z.string()).optional(), // Equipment association will be handled separately if needed
});

export type BulkConsumableInput = z.infer<typeof bulkConsumableSchema>;

interface BulkUploadResult {
  successCount: number;
  failureCount: number;
  failedItems: { data: any; errors: string[] }[];
}

export async function bulkCreateConsumable(consumableData: BulkConsumableInput[]): Promise<BulkUploadResult> {
  const results: BulkUploadResult = {
    successCount: 0,
    failureCount: 0,
    failedItems: [],
  };

  for (const item of consumableData) {
    const validation = bulkConsumableSchema.safeParse(item);

  if (!validation.success) {
  results.failureCount++;
  results.failedItems.push({
    data: item,
    errors: Object.values(validation.error.flatten().fieldErrors).flat(),
  });
  continue;
}

    const validatedData = validation.data;

    try {
      // Check for existing consumable by name and category (or a more unique identifier if available)
      // For consumables, a unique serial number might not always exist.
      // We'll check by name and category for now to avoid obvious duplicates.
      const existingConsumable = await prisma.consumable.findFirst({
        where: { 
          name: validatedData.name,
          category: validatedData.category,
          // Add more unique fields if available, e.g., supplier, unit
        },
      });

      if (existingConsumable) {
        // Skip if a similar consumable already exists
        results.failureCount++;
        results.failedItems.push({
          data: item,
          errors: [`Consumable "${validatedData.name}" (${validatedData.category}) already exists. Skipping.`],
        });
        continue;
      }

      await prisma.consumable.create({
        data: {
          ...validatedData,
          quantity: Number(validatedData.quantity) || 0,
          currentStock: Number(validatedData.currentStock),
          minimumStock: Number(validatedData.minimumStock),
          unitCost: validatedData.unitCost ? Number(validatedData.unitCost) : null,
        },
      });
      results.successCount++;
    } catch (error: any) {
      results.failureCount++;
      results.failedItems.push({
        data: item,
        errors: [error.message || 'An unknown error occurred during database insertion.'],
      });
    }
  }

  revalidatePath('/consumables'); // Revalidate the consumables page to show new data
  return results;
}
