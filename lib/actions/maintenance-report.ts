// lib/actions/maintenance-report.ts
'use server';


import { MaintenanceStatus } from '@prisma/client';
import { endOfDay, startOfDay } from 'date-fns';
import { prisma } from '../prisma';

interface MaintenanceReportData {
  totalMaintenances: number;
  maintenanceByStatus: { name: string; value: number }[];
  maintenanceByType: { name: string; value: number }[];
  maintenanceByEquipment: { name: string; value: number }[];
  maintenanceTrends: { date: string; maintenances: number }[];
  averageMaintenanceDuration: string;
  mostFrequentEquipmentForMaintenance: { name: string; count: number }[];
}

export async function getMaintenanceReportData(startDate?: Date, endDate?: Date): Promise<MaintenanceReportData> {
  const whereClause = {
    startDate: {
      gte: startDate ? startOfDay(startDate) : undefined,
    },
    endDate: {
      lte: endDate ? endOfDay(endDate) : undefined,
    },
  };

  // 1. Total Maintenances
  const totalMaintenances = await prisma.maintenance.count({ where: whereClause });

  // 2. Maintenance by Status
  const maintenanceByStatusRaw = await prisma.maintenance.groupBy({
    by: ['status'],
    _count: { id: true },
    where: whereClause,
  });
  const maintenanceByStatus = maintenanceByStatusRaw.map(item => ({
    name: item.status.replace(/_/g, ' '),
    value: item._count.id,
  }));

  // 3. Maintenance by Type
  const maintenanceByTypeRaw = await prisma.maintenance.groupBy({
    by: ['type'],
    _count: { id: true },
    where: whereClause,
  });
  const maintenanceByType = maintenanceByTypeRaw.map(item => ({
    name: item.type.replace(/_/g, ' '),
    value: item._count.id,
  }));

  // 4. Maintenance by Equipment
  const maintenanceByEquipmentRaw = await prisma.maintenance.groupBy({
    by: ['equipmentId'],
    _count: { id: true },
    where: whereClause,
  });
  const maintenanceByEquipment = await Promise.all(
    maintenanceByEquipmentRaw.map(async (item) => {
      const equipment = await prisma.equipment.findUnique({
        where: { id: item.equipmentId },
        select: { name: true },
      });
      return {
        name: equipment?.name || 'Unknown Equipment',
        value: item._count.id,
      };
    })
  );

  // 5. Maintenance Trends (monthly)
  const maintenanceTrendsRaw = await prisma.$queryRaw`
    SELECT
      TO_CHAR("startDate", 'YYYY-MM') as month,
      COUNT(id)::int as maintenances
    FROM "Maintenance"
    WHERE "startDate" >= ${startDate || new Date(0)} AND "startDate" <= ${endDate || new Date()}
    GROUP BY month
    ORDER BY month ASC;
  `;
  const maintenanceTrends = (maintenanceTrendsRaw as any[]).map(item => ({
    date: item.month,
    maintenances: item.maintenances,
  }));

  // 6. Average Maintenance Duration
  const completedMaintenances = await prisma.maintenance.findMany({
    where: {
      ...whereClause,
      status: MaintenanceStatus.COMPLETED,
      endDate: { not: null },
    },
    select: { startDate: true, endDate: true },
  });

  let totalDurationMs = 0;
  completedMaintenances.forEach(m => {
    if (m.startDate && m.endDate) {
      totalDurationMs += m.endDate.getTime() - m.startDate.getTime();
    }
  });
  const averageDurationMs = completedMaintenances.length > 0 ? totalDurationMs / completedMaintenances.length : 0;
  const averageMaintenanceDuration = averageDurationMs > 0 ? `${(averageDurationMs / (1000 * 60 * 60 * 24)).toFixed(1)} days` : "N/A"; // Convert to days

  // 7. Most Frequent Equipment for Maintenance
  const mostFrequentEquipmentForMaintenance = maintenanceByEquipment
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) // Top 5
    .map(item => ({ name: item.name, count: item.value }));

  return {
    totalMaintenances,
    maintenanceByStatus,
    maintenanceByType,
    maintenanceByEquipment,
    maintenanceTrends,
    averageMaintenanceDuration,
    mostFrequentEquipmentForMaintenance,
  };
}
