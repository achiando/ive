// lib/actions/equipment-report.ts
'use server';


import { endOfDay, startOfDay } from 'date-fns';
import { prisma } from '../prisma';

interface EquipmentReportData {
  totalEquipment: number;
  equipmentByStatus: { name: string; value: number }[];
  equipmentByCategory: { name: string; value: number }[];
  totalBookings: number;
  averageBookingDuration: string; // e.g., "2.5 hours"
  mostBookedEquipment: { name: string; bookings: number }[];
  bookingTrends: { date: string; bookings: number }[];
  totalMaintenance: number;
  maintenanceByStatus: { name: string; value: number }[];
  maintenanceByType: { name: string; value: number }[];
}

export async function getEquipmentReportData(startDate?: Date, endDate?: Date): Promise<EquipmentReportData> {
  const whereClause = {
    createdAt: {
      gte: startDate ? startOfDay(startDate) : undefined,
      lte: endDate ? endOfDay(endDate) : undefined,
    },
  };

  const bookingWhereClause = {
    startDate: {
      gte: startDate ? startOfDay(startDate) : undefined,
    },
    endDate: {
      lte: endDate ? endOfDay(endDate) : undefined,
    },
  };

  const maintenanceWhereClause = {
    startDate: {
      gte: startDate ? startOfDay(startDate) : undefined,
    },
    endDate: {
      lte: endDate ? endOfDay(endDate) : undefined,
    },
  };

  // 1. Total Equipment
  const totalEquipment = await prisma.equipment.count();

  // 2. Equipment by Status
  const equipmentByStatusRaw = await prisma.equipment.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });
  const equipmentByStatus = equipmentByStatusRaw.map(item => ({
    name: item.status,
    value: item._count.id,
  }));

  // 3. Equipment by Category
  const equipmentByCategoryRaw = await prisma.equipment.groupBy({
    by: ['category'],
    _count: {
      id: true,
    },
  });
  const equipmentByCategory = equipmentByCategoryRaw.map(item => ({
    name: item.category,
    value: item._count.id,
  }));

  // 4. Total Bookings
  const totalBookings = await prisma.equipmentBooking.count({
    where: bookingWhereClause,
  });

  // 5. Average Booking Duration
  const allBookings = await prisma.equipmentBooking.findMany({
    where: bookingWhereClause,
    select: {
      startDate: true,
      endDate: true,
    },
  });

  let totalDurationMs = 0;
  allBookings.forEach(booking => {
    if (booking.startDate && booking.endDate) {
      totalDurationMs += booking.endDate.getTime() - booking.startDate.getTime();
    }
  });

  const averageDurationMs = allBookings.length > 0 ? totalDurationMs / allBookings.length : 0;
  const averageBookingDuration = averageDurationMs > 0 ? `${(averageDurationMs / (1000 * 60 * 60)).toFixed(1)} hours` : "N/A";

  // 6. Most Booked Equipment
  const mostBookedEquipmentRaw = await prisma.equipmentBooking.groupBy({
    by: ['equipmentId'],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 5, // Top 5 most booked
  });

  const mostBookedEquipment = await Promise.all(
    mostBookedEquipmentRaw.map(async (item) => {
      const equipment = await prisma.equipment.findUnique({
        where: { id: item.equipmentId },
        select: { name: true },
      });
      return {
        name: equipment?.name || 'Unknown Equipment',
        bookings: item._count.id,
      };
    })
  );

  // 7. Booking Trends (monthly)
  const bookingTrendsRaw = await prisma.$queryRaw`
    SELECT
      TO_CHAR("startDate", 'YYYY-MM') as month,
      COUNT(id)::int as bookings
    FROM "EquipmentBooking"
    WHERE "startDate" >= ${startDate || new Date(0)} AND "startDate" <= ${endDate || new Date()}
    GROUP BY month
    ORDER BY month ASC;
  `;
  // Note: Prisma's groupBy doesn't directly support date formatting for trends, so using raw query for now.
  // Need to cast the raw query result to a proper type if using TypeScript strictly.
  const bookingTrends = (bookingTrendsRaw as any[]).map(item => ({
    date: item.month,
    bookings: item.bookings,
  }));


  // 8. Total Maintenance
  const totalMaintenance = await prisma.maintenance.count({
    where: maintenanceWhereClause,
  });

  // 9. Maintenance by Status
  const maintenanceByStatusRaw = await prisma.maintenance.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
    where: maintenanceWhereClause,
  });
  const maintenanceByStatus = maintenanceByStatusRaw.map(item => ({
    name: item.status,
    value: item._count.id,
  }));

  // 10. Maintenance by Type
  const maintenanceByTypeRaw = await prisma.maintenance.groupBy({
    by: ['type'],
    _count: {
      id: true,
    },
    where: maintenanceWhereClause,
  });
  const maintenanceByType = maintenanceByTypeRaw.map(item => ({
    name: item.type,
    value: item._count.id,
  }));

  return {
    totalEquipment,
    equipmentByStatus,
    equipmentByCategory,
    totalBookings,
    averageBookingDuration,
    mostBookedEquipment,
    bookingTrends,
    totalMaintenance,
    maintenanceByStatus,
    maintenanceByType,
  };
}
