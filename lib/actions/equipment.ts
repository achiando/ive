"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { EquipmentFormValues } from "@/app/(dashboard)/equipments/_components/EquipmentForm";
import { Project } from "@/types/equipment"; // Import Project type
import { ProjectStatus } from "@prisma/client"; // Import ProjectStatus enum from Prisma

export async function getEquipments() {
  try {
    const equipments = await prisma.equipment.findMany({
      include: {
        maintenances: true,
        bookings: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return equipments;
  } catch (error) {
    console.error("Error getting equipments:", error);
    return [];
  }
}

export async function getEquipmentById(id: string) {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        maintenances: true,
        bookings: true,
      },
    });
    return equipment;
  } catch (error) {
    console.error(`Error getting equipment with ID ${id}:`, error);
    return null;
  }
}

export async function createEquipment(data: EquipmentFormValues) {
  try {
    // For now, imageFile and manualFile are not handled by direct upload here.
    // They would typically be uploaded to a storage service (e.g., S3, Supabase Storage)
    // and their URLs stored in the database.
    const { imageFile, manualFile, ...equipmentData } = data;

    const newEquipment = await prisma.equipment.create({
      data: {
        ...equipmentData,
        // status is already a string (from EquipmentFormValues)
      },
    });
    revalidatePath("/equipments");
    return { success: true, data: newEquipment };
  } catch (error: any) {
    console.error("Error creating equipment:", error);
    return { success: false, message: error.message || "Failed to create equipment." };
  }
}

export async function updateEquipment(id: string, data: Partial<EquipmentFormValues>) {
  try {
    const { imageFile, manualFile, ...equipmentData } = data;

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: {
        ...equipmentData,
        // status is already a string (from EquipmentFormValues)
      },
    });
    revalidatePath("/equipments");
    revalidatePath(`/equipments/${id}`);
    return { success: true, data: updatedEquipment };
  } catch (error: any) {
    console.error(`Error updating equipment with ID ${id}:`, error);
    return { success: false, message: error.message || "Failed to update equipment." };
  }
}

export async function deleteEquipment(id: string) {
  try {
    await prisma.equipment.delete({
      where: { id },
    });
    revalidatePath("/equipments");
    return { success: true, message: "Equipment deleted successfully." };
  } catch (error: any) {
    console.error(`Error deleting equipment with ID ${id}:`, error);
    return { success: false, message: error.message || "Failed to delete equipment." };
  }
}

export async function updateEquipmentStatus(id: string, status: string) { // Changed type back to string
  try {
    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/equipments");
    revalidatePath(`/equipments/${id}`);
    return { success: true, data: updatedEquipment };
  } catch (error: any) {
    console.error(`Error updating equipment status for ID ${id}:`, error);
    return { success: false, message: error.message || "Failed to update equipment status." };
  }
}

export async function getProjectsForEquipment(equipmentId: string): Promise<Project[]> {
  try {
    // Fetch projects that are approved and potentially associated with this equipment
    // For simplicity, let's fetch all APPROVED projects for now.
    const projects = await prisma.project.findMany({
      where: {
        status: ProjectStatus.APPROVED,
        // In a more complex scenario, you might filter by projects that have
        // previously booked this equipment, or projects the current user is part of.
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
      },
    });

    // Map PrismaProject to the Project type defined in types/equipment.ts
    return projects.map(p => ({
      id: p.id,
      title: p.title,
      startDate: p.startDate?.toISOString() || null, // Convert Date to string
      endDate: p.endDate?.toISOString() || null,     // Convert Date to string
    }));
  } catch (error) {
    console.error(`Error fetching projects for equipment ID ${equipmentId}:`, error);
    return [];
  }
}