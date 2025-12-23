"use server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    GetSafetyTestsParams,
    SafetyTestFormValues,
    SafetyTestWithRelations
} from "@/types/safety-test";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

const isAdminOrManager = (role: UserRole): role is 'ADMIN' | 'LAB_MANAGER' | 'ADMIN_TECHNICIAN' =>
  [UserRole.ADMIN, UserRole.LAB_MANAGER, UserRole.ADMIN_TECHNICIAN].includes(role as any);

export async function createSafetyTest(
  data: SafetyTestFormValues
): Promise<SafetyTestWithRelations> {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized: Only admins and lab managers can create safety tests.");
  }

  const { associatedEquipmentType, ...rest } = data;

  try {
    const newSafetyTest = await prisma.safetyTest.create({
      data: {
        ...rest,
        associatedEquipmentType: Array.isArray(associatedEquipmentType)
          ? associatedEquipmentType.join(',')
          : associatedEquipmentType
      },
      include: {
        attempts: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            equipment: { select: { id: true, name: true, serialNumber: true } },
            safetyTest: { select: { id: true, name: true } },
          },
        },
      },
    });
    const transformedSafetyTest = {
      ...newSafetyTest,
      associatedEquipmentTypes: newSafetyTest.associatedEquipmentType
        ? newSafetyTest.associatedEquipmentType.split(',')
        : []
    };
    revalidatePath("/dashboard/sop");
    return transformedSafetyTest;
  } catch (error: any) {
    console.error("Error creating safety test:", error);
    throw new Error(`Failed to create safety test: ${error.message}`);
  }
}

export async function getSafetyTests(
  params: GetSafetyTestsParams = {}
): Promise<SafetyTestWithRelations[]> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }

  const { searchQuery, associatedEquipmentType, requiredForRole, frequency, page = 1, pageSize = 10 } = params;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { description: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  if (associatedEquipmentType) {
    where.associatedEquipmentTypes = {
      has: associatedEquipmentType,
    };
  }

  if (requiredForRole) {
    where.requiredForRoles = {
      has: requiredForRole,
    };
  }

  if (frequency) {
    where.frequency = frequency;
  }

  try {
    const safetyTests = await prisma.safetyTest.findMany({
      where,
      include: {
        attempts: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            equipment: { select: { id: true, name: true, serialNumber: true } },
            safetyTest: { select: { id: true, name: true } },
          },
        },
        
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    });

    // Map the results to match the SafetyTestWithRelations type
    const safetyTestsWithRelations = safetyTests.map(test => ({
      ...test,
      associatedEquipmentTypes: test.associatedEquipmentType ? test.associatedEquipmentType.split(',') : []
    }));

    return safetyTestsWithRelations;
  } catch (error: any) {
    console.error("Error fetching safety tests:", error);
    throw new Error(`Failed to fetch safety tests: ${error.message}`);
  }
}

export async function getSafetyTestById(id: string): Promise<SafetyTestWithRelations | null> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    const safetyTest = await prisma.safetyTest.findUnique({
      where: { id },
      include: {
        attempts: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            equipment: { select: { id: true, name: true, serialNumber: true } },
          },
        },
      },
    });

    if (!safetyTest) return null;

    // Map the result to match the SafetyTestWithRelations type
    return {
      ...safetyTest,
      associatedEquipmentTypes: safetyTest.associatedEquipmentType ? safetyTest.associatedEquipmentType.split(',') : [],
      attempts: safetyTest.attempts.map(attempt => ({
        ...attempt,
        safetyTest: {
          id: safetyTest.id,
          name: safetyTest.name,
          description: safetyTest.description,
          manualUrl: safetyTest.manualUrl,
          manualType: safetyTest.manualType,
          requiredForRoles: safetyTest.requiredForRoles,
          frequency: safetyTest.frequency,
          createdAt: safetyTest.createdAt,
          updatedAt: safetyTest.updatedAt,
          associatedEquipmentTypes: safetyTest.associatedEquipmentType ? safetyTest.associatedEquipmentType.split(',') : []
        }
      }))
    };
  } catch (error: any) {
    console.error(`Error fetching safety test with ID ${id}:`, error);
    throw new Error(`Failed to fetch safety test: ${error.message}`);
  }
}

export async function updateSafetyTest(
  id: string,
  data: Partial<SafetyTestFormValues>
): Promise<SafetyTestWithRelations> {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized: Only admins and lab managers can update safety tests.");
  }

  const { associatedEquipmentType, ...rest } = data;

  try {
    const updatedSafetyTest = await prisma.safetyTest.update({
      where: { id },
      data: {
        ...rest,
        associatedEquipmentType: Array.isArray(associatedEquipmentType)
          ? associatedEquipmentType.join(',')
          : associatedEquipmentType
      },
      include: {
        attempts: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            equipment: {
              select: {
                id: true,
                name: true,
                serialNumber: true,
              },
            },
            safetyTest: true, // Add this line to include the safetyTest relation
          },
        },
      },
    });

    const result = {
      ...updatedSafetyTest,
      associatedEquipmentTypes: updatedSafetyTest.associatedEquipmentType
        ? updatedSafetyTest.associatedEquipmentType.split(',')
        : []
    };
    revalidatePath("/dashboard/sop");
    revalidatePath(`/dashboard/sop/${id}`);
    return result;
  } catch (error: any) {
    console.error(`Error updating safety test with ID ${id}:`, error);
    throw new Error(`Failed to update safety test: ${error.message}`);
  }
}

export async function deleteSafetyTest(id: string): Promise<{ success: boolean; message?: string }> {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized: Only admins and lab managers can delete safety tests.");
  }

  try {
    await prisma.safetyTest.delete({
      where: { id },
    });
    revalidatePath("/dashboard/sop");
    return { success: true, message: "Safety test deleted successfully." };
  } catch (error: any) {
    console.error(`Error deleting safety test with ID ${id}:`, error);
    throw new Error(`Failed to delete safety test: ${error.message}`);
  }
}

export async function recordSafetyTestAttempt(
  safetyTestId: string | undefined,
  equipmentId: string | undefined,
  score: number, // score is handled locally, not persisted
  totalQuestions: number // totalQuestions is handled locally, not persisted
): Promise<{ success: boolean; message: string }> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, message: "Unauthorized: You must be logged in to record a safety test attempt." };
  }

  if (!safetyTestId && !equipmentId) {
    return { success: false, message: "Cannot record safety test attempt: Either safetyTestId or equipmentId must be provided." };
  }

  const userId = session.user.id;

  try {
    await prisma.safetyTestAttempt.create({
      data: {
        safetyTestId,
        userId,
        equipmentId,
        completedAt: new Date(),
      },
    });
    if (safetyTestId) revalidatePath(`/dashboard/sop/${safetyTestId}`);
    if (equipmentId) revalidatePath(`/dashboard/equipments/${equipmentId}`); // Revalidate equipment page to show updated attempts
    return { success: true, message: "Safety test attempt recorded successfully." };
  } catch (error: any) {
    console.error("Error recording safety test attempt:", error);
    return { success: false, message: `Failed to record safety test attempt: ${error.message}` };
  }
}
