// lib/actions/consumable-analytics.ts
'use server';

import { ConsumableCategory } from '@prisma/client';
import { format, subMonths } from 'date-fns';
import { prisma } from '../prisma';

interface ConsumableAnalyticsData {
  totalItems: number;
  totalStock: number;
  totalValue: number;
  statusCounts: {
    IN_STOCK: number;
    LOW_STOCK: number;
    OUT_OF_STOCK: number;
  };
  categoryCounts: Record<ConsumableCategory, number>;
  monthlyConsumption: Record<string, number>;
  consumablesList: Array<{
    id: string;
    name: string;
    category: ConsumableCategory;
    currentStock: number;
    minimumStock: number;
    unit: string;
    unitCost: number | null;
    totalAllocated: number;
  }>;
}

export async function getConsumableAnalyticsData(): Promise<ConsumableAnalyticsData> {
  // Fetch all consumables
  const allConsumables = await prisma.consumable.findMany({
    include: {
      allocations: {
        select: { quantity: true },
      },
    },
  });

  // Initialize analytics data
  let totalItems = allConsumables.length;
  let totalStock = 0;
  let totalValue = 0;
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;
  const categoryCounts: Record<ConsumableCategory, number> = {
    CONSUMABLE: 0,
    SPARE: 0,
  };
  const monthlyConsumption: Record<string, number> = {};
  const consumablesList: ConsumableAnalyticsData['consumablesList'] = [];

  // Process each consumable
  for (const consumable of allConsumables) {
    totalStock += consumable.currentStock;
    if (consumable.unitCost) {
      totalValue += consumable.currentStock * consumable.unitCost;
    }

    // Stock status counts
    if (consumable.currentStock === 0) {
      outOfStock++;
    } else if (consumable.currentStock <= consumable.minimumStock) {
      lowStock++;
    } else {
      inStock++;
    }

    // Category counts
    categoryCounts[consumable.category]++;

    // Calculate total allocated for each consumable
    const totalAllocated = consumable.allocations.reduce((sum, alloc) => sum + alloc.quantity, 0);

    consumablesList.push({
      id: consumable.id,
      name: consumable.name,
      category: consumable.category,
      currentStock: consumable.currentStock,
      minimumStock: consumable.minimumStock,
      unit: consumable.unit || '',
      unitCost: consumable.unitCost || null,
      totalAllocated: totalAllocated,
    });

    // Monthly consumption (last 6 months)
    const sixMonthsAgo = subMonths(new Date(), 6);
    const relevantAllocations = await prisma.consumableAllocation.findMany({
      where: {
        consumableId: consumable.id,
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
        quantity: true,
      },
    });

    relevantAllocations.forEach(alloc => {
      const monthKey = format(alloc.createdAt, 'yyyy-MM');
      monthlyConsumption[monthKey] = (monthlyConsumption[monthKey] || 0) + alloc.quantity;
    });
  }

  return {
    totalItems,
    totalStock,
    totalValue,
    statusCounts: {
      IN_STOCK: inStock,
      LOW_STOCK: lowStock,
      OUT_OF_STOCK: outOfStock,
    },
    categoryCounts,
    monthlyConsumption,
    consumablesList,
  };
}
