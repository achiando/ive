// lib/actions/bulk-equipment.ts
'use server';


import { EquipmentStatus } from '@/types/equipment';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '../prisma';

// Define a schema for the incoming bulk data, which should align with EquipmentFormValues
// We'll use a subset or adapt EquipmentFormValues for direct database insertion
const bulkEquipmentSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  status: z.nativeEnum(EquipmentStatus),
  dailyCapacity: z.number().int().positive({ message: 'Daily Capacity must be a positive number' }),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  manualUrl: z.string().url('Invalid manual URL').optional().or(z.literal('')),
});

export type BulkEquipmentInput = z.infer<typeof bulkEquipmentSchema>;

interface BulkUploadResult {
  successCount: number;
  failureCount: number;
  failedItems: { data: any; errors: string[] }[];
}

export async function bulkCreateEquipment(equipmentData: BulkEquipmentInput[]): Promise<BulkUploadResult> {
  const results: BulkUploadResult = {
    successCount: 0,
    failureCount: 0,
    failedItems: [],
  };

  for (const item of equipmentData) {
    const validation = bulkEquipmentSchema.safeParse(item);

    if (!validation.success) {
      results.failureCount++;
      results.failedItems.push({
        data: item,
        errors: validation.error.issues.map(err => err.message),
      });
      continue;
    }

    const validatedData = validation.data;

    try {
      // Check for existing serial number
      if (validatedData.serialNumber) {
        const existingEquipment = await prisma.equipment.findUnique({
          where: { serialNumber: validatedData.serialNumber },
        });

        if (existingEquipment) {
          // Skip if serial number already exists, as per user's request "should not give error for those"
          results.failureCount++;
          results.failedItems.push({
            data: item,
            errors: [`Equipment with serial number ${validatedData.serialNumber} already exists. Skipping.`],
          });
          continue;
        }
      }

      await prisma.equipment.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          category: validatedData.category,
          model: validatedData.model,
          serialNumber: validatedData.serialNumber,
          location: validatedData.location,
          status: validatedData.status,
          dailyCapacity: validatedData.dailyCapacity,
          image: validatedData.imageUrl || null, // Map imageUrl to image
          manualUrl: validatedData.manualUrl || null,
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

  revalidatePath('/equipments'); // Revalidate the equipments page to show new data
  return results;
}
