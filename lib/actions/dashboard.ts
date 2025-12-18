"use server";

import { EventWithVenue } from "@/app/(dashboard)/events/_components/EventCard";
import { prisma } from "@/lib/prisma";
import { BookingStatus, MaintenanceStatus } from "@prisma/client";
import { unstable_cache as cache, revalidatePath } from "next/cache";

// Helper to get current date without time for comparisons
const getToday = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

// ============================================================================
// Admin/Lab Manager Dashboard Data
// ============================================================================

interface AdminDashboardData {
  totalEquipment: number;
  availableEquipment: number;
  pendingBookings: number;
  activeMaintenance: number;
  recentBookings: any[]; // TODO: Define a more specific type
  upcomingEvents: EventWithVenue[];
  pendingMaintenance: any[]; // TODO: Define a more specific type
  lowStockItems: any[]; // TODO: Define a more specific type
  fullyBookedEquipment: any[]; // New field
}

export const getFullyBookedEquipment = async () => {
  const today = getToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const equipmentWithBookings = await prisma.equipment.findMany({
    where: {
      bookings: {
        some: {
          status: { in: [BookingStatus.APPROVED, BookingStatus.IN_PROGRESS] },
          startDate: { lt: tomorrow }, // Booking starts before tomorrow
          endDate: { gte: today },    // Booking ends on or after today
        },
      },
    },
    include: {
      bookings: {
        where: {
          status: { in: [BookingStatus.APPROVED, BookingStatus.IN_PROGRESS] },
          startDate: { lt: tomorrow },
          endDate: { gte: today },
        },
        select: {
          bookingHours: true,
        },
      },
    },
  });

  const fullyBookedEquipment = equipmentWithBookings.filter(equipment => {
    const totalBookedHoursToday = equipment.bookings.reduce((sum, booking) => sum + (booking.bookingHours || 0), 0);
    return equipment.dailyCapacity && totalBookedHoursToday >= equipment.dailyCapacity;
  });

  return fullyBookedEquipment;
};

export const getAdminDashboardData = cache(
  async (): Promise<AdminDashboardData> => {
    const today = getToday();

    const [
      totalEquipment,
      availableEquipment,
      pendingBookings,
      activeMaintenance,
      recentBookings,
      upcomingEvents,
      pendingMaintenance,
      lowStockItems,
      fullyBookedEquipment, // New data point
    ] = await Promise.all([
      prisma.equipment.count(),
      prisma.equipment.count({ where: { status: "AVAILABLE" } }),
      prisma.equipmentBooking.count({ where: { status: BookingStatus.PENDING } }),
      prisma.maintenance.count({
        where: {
          status: { in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.PENDING] },
        },
      }),
      prisma.equipmentBooking.findMany({
        where: {
          status: { in: [BookingStatus.APPROVED, BookingStatus.IN_PROGRESS, BookingStatus.CHECKED_OUT] },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          equipment: { select: { name: true } },
        },
      }),
      prisma.event.findMany({
        where: {
          startDate: { gte: today },
        },
        orderBy: { startDate: "asc" },
        take: 5,
        include: {
          _count: { select: { participants: true } },
        },
      }),
      prisma.maintenance.findMany({
        where: {
          status: { in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.PENDING] },
        },
        orderBy: { startDate: "asc" },
        take: 5,
        include: {
          equipment: { select: { name: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.consumable.findMany({
        where: {
          currentStock: { lte: prisma.consumable.fields.minimumStock }, // Compare with minimumStock field
        },
        orderBy: { currentStock: "asc" },
        take: 5,
      }),
      getFullyBookedEquipment(), // Call the new function
    ]);

    return {
      totalEquipment,
      availableEquipment,
      pendingBookings,
      activeMaintenance,
      recentBookings,
      upcomingEvents: upcomingEvents as EventWithVenue[], // Cast to EventWithVenue
      pendingMaintenance,
      lowStockItems,
      fullyBookedEquipment, // Include in return
    };
  },
  ["admin-dashboard-data"],
  { revalidate: 3600 } // Revalidate every hour
);

// ============================================================================
// Student/Faculty/Lecturer Dashboard Data
// ============================================================================

interface StudentDashboardData {
  stats: {
    activeBookings: number;
    upcomingBookings: number;
    availableEquipment: number;
    pendingRequests: number;
  };
  activeBookings: any[]; // TODO: Define a more specific type
  upcomingBookings: any[]; // TODO: Define a more specific type
  bookingHistory: any[]; // TODO: Define a more specific type
}

export const getStudentDashboardData = cache(
  async (userId: string): Promise<StudentDashboardData> => {
    const today = getToday();

    const [
      activeBookingsCount,
      upcomingBookingsCount,
      availableEquipmentCount,
      pendingRequestsCount,
      activeBookings,
      upcomingBookings,
      bookingHistory,
    ] = await Promise.all([
      prisma.equipmentBooking.count({
        where: {
          userId,
          status: { in: [BookingStatus.APPROVED, BookingStatus.IN_PROGRESS, BookingStatus.CHECKED_OUT] },
          endDate: { gte: today },
        },
      }),
      prisma.equipmentBooking.count({
        where: {
          userId,
          status: BookingStatus.PENDING,
          startDate: { gte: today },
        },
      }),
      prisma.equipment.count({ where: { status: "AVAILABLE" } }), // All available equipment, not just user's
      prisma.equipmentBooking.count({
        where: {
          userId,
          status: BookingStatus.PENDING,
        },
      }),
      prisma.equipmentBooking.findMany({
        where: {
          userId,
          status: { in: [BookingStatus.APPROVED, BookingStatus.IN_PROGRESS, BookingStatus.CHECKED_OUT] },
          endDate: { gte: today },
        },
        orderBy: { startDate: "asc" },
        take: 5,
        include: { equipment: { select: { name: true } } },
      }),
      prisma.equipmentBooking.findMany({
        where: {
          userId,
          status: BookingStatus.PENDING,
          startDate: { gte: today },
        },
        orderBy: { startDate: "asc" },
        take: 5,
        include: { equipment: { select: { name: true } } },
      }),
      prisma.equipmentBooking.findMany({
        where: {
          userId,
          status: BookingStatus.COMPLETED,
          endDate: { lt: today },
        },
        orderBy: { endDate: "desc" },
        take: 5,
        include: { equipment: { select: { name: true } } },
      }),
    ]);

    return {
      stats: {
        activeBookings: activeBookingsCount,
        upcomingBookings: upcomingBookingsCount,
        availableEquipment: availableEquipmentCount,
        pendingRequests: pendingRequestsCount,
      },
      activeBookings,
      upcomingBookings,
      bookingHistory,
    };
  },
  ["student-dashboard-data"],
  { revalidate: 3600 }
);

// ============================================================================
// Technician Dashboard Data
// ============================================================================

interface TechnicianDashboardData {
  stats: {
    assignedMaintenance: number;
    completedMaintenance: number;
    pendingMaintenance: number;
    inProgressMaintenance: number;
  };
  recentMaintenance: any[]; // TODO: Define a more specific type
  upcomingMaintenance: any[]; // TODO: Define a more specific type
}

export const getTechnicianDashboardData = cache(
  async (userId: string): Promise<TechnicianDashboardData> => {
    const today = getToday();

    const [
      assignedMaintenanceCount,
      completedMaintenanceCount,
      pendingMaintenanceCount,
      inProgressMaintenanceCount,
      recentMaintenance,
      upcomingMaintenance,
    ] = await Promise.all([
      prisma.maintenance.count({ where: { assignedToId: userId } }),
      prisma.maintenance.count({
        where: { assignedToId: userId, status: MaintenanceStatus.COMPLETED },
      }),
      prisma.maintenance.count({
        where: { assignedToId: userId, status: MaintenanceStatus.PENDING },
      }),
      prisma.maintenance.count({
        where: { assignedToId: userId, status: MaintenanceStatus.IN_PROGRESS },
      }),
      prisma.maintenance.findMany({
        where: { assignedToId: userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { equipment: { select: { name: true } } },
      }),
      prisma.maintenance.findMany({
        where: {
          assignedToId: userId,
          status: { in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.PENDING] },
          startDate: { gte: today },
        },
        orderBy: { startDate: "asc" },
        take: 5,
        include: { equipment: { select: { name: true } } },
      }),
    ]);

    return {
      stats: {
        assignedMaintenance: assignedMaintenanceCount,
        completedMaintenance: completedMaintenanceCount,
        pendingMaintenance: pendingMaintenanceCount,
        inProgressMaintenance: inProgressMaintenanceCount,
      },
      recentMaintenance,
      upcomingMaintenance,
    };
  },
  ["technician-dashboard-data"],
  { revalidate: 3600 }
);

// Revalidation functions (example)
export async function revalidateAdminDashboard() {
  revalidatePath("/dashboard");
  revalidatePath("/admin"); // If there's a dedicated admin route
  revalidatePath("/lab-manager"); // If there's a dedicated lab manager route
  revalidatePath("/equipment");
  revalidatePath("/maintenance");
  revalidatePath("/events");
  revalidatePath("/consumables");
}

export async function revalidateUserDashboard(userId: string) {
  'use server';
  revalidatePath("/dashboard");
  revalidatePath(`/users/${userId}/dashboard`); // If user has a specific dashboard route
}

export async function revalidateTechnicianDashboard(userId: string) {
  'use server';
  revalidatePath("/dashboard");
  revalidatePath(`/technician/${userId}/dashboard`); // If technician has a specific dashboard route
}
