"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import {
  SafetyTestFormValues,
  GetSafetyTestsParams,
  SafetyTestWithRelations,
  SafetyTestAttemptWithRelations,
} from "@/types/safety-test";

const isAdminOrManager = (role: UserRole) =>
  [UserRole.ADMIN, UserRole.LAB_MANAGER, UserRole.ADMIN_TECHNICIAN].includes(role);

export async function createSafetyTest(
  data: SafetyTestFormValues
): Promise<SafetyTestWithRelations> {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminOrManager(session.user.role)) {
    throw new Error("Unauthorized: Only admins and lab managers can create safety tests.");
  }

  const { associatedEquipmentTypes, ...rest } = data;

  try {
    const newSafetyTest = await prisma.safetyTest.create({
      data: {
        ...rest,
        associatedEquipmentTypes: associatedEquipmentTypes || [], // Ensure it's an array
      },
      include: {
        attempts: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            equipment: { select: { id: true, name: true, serialNumber: true } },
          },
        },
      },
    });
    revalidatePath("/dashboard/sop");
    return newSafetyTest;
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    });
    return safetyTests;
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
    return safetyTest;
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

  const { associatedEquipmentTypes, ...rest } = data;

  try {
    const updatedSafetyTest = await prisma.safetyTest.update({
      where: { id },
      data: {
        ...rest,
        associatedEquipmentTypes: associatedEquipmentTypes || [],
      },
      include: {
        attempts: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            equipment: { select: { id: true, name: true, serialNumber: true } },
          },
        },
      },
    });
    revalidatePath("/dashboard/sop");
    revalidatePath(`/dashboard/sop/${id}`);
    return updatedSafetyTest;
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
  safetyTestId: string,
  equipmentId: string
): Promise<SafetyTestAttemptWithRelations> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized: You must be logged in to record a safety test attempt.");
  }

  const userId = session.user.id;

  try {
    const newAttempt = await prisma.safetyTestAttempt.create({
      data: {
        safetyTestId,
        userId,
        equipmentId,
        completedAt: new Date(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        equipment: { select: { id: true, name: true, serialNumber: true } },
        safetyTest: { select: { id: true, name: true } },
      },
    });
    revalidatePath(`/dashboard/sop/${safetyTestId}`);
    revalidatePath(`/dashboard/equipments/${equipmentId}`); // Revalidate equipment page to show updated attempts
    return newAttempt;
  } catch (error: any) {
    console.error("Error recording safety test attempt:", error);
    throw new Error(`Failed to record safety test attempt: ${error.message}`);
  }
}
