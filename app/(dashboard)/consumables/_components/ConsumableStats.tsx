"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Box, PackageCheck, PackageMinus, AlertTriangle } from "lucide-react";
import { ConsumableCategory } from "@prisma/client";

// TODO: Define a proper type for ConsumableWithRelations
interface ConsumableWithRelations {
  id: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  category: ConsumableCategory;
  // Add other fields as necessary for stats calculation
}

interface ConsumableStatsProps {
  consumables: ConsumableWithRelations[];
  isLoading: boolean;
}

export const ConsumableStats = ({ consumables, isLoading }: ConsumableStatsProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const totalConsumables = consumables.length;
  const inStockCount = consumables.filter(c => c.currentStock > c.minimumStock).length;
  const lowStockCount = consumables.filter(c => c.currentStock <= c.minimumStock && c.currentStock > 0).length;
  const outOfStockCount = consumables.filter(c => c.currentStock === 0).length;

  const stats = {
    totalConsumables,
    inStockCount,
    lowStockCount,
    outOfStockCount,
  };

  const cards = [
    {
      title: "Total Consumables",
      value: stats.totalConsumables,
      icon: <Box className="h-4 w-4 text-muted-foreground" />,
      description: "Total unique items in inventory"
    },
    {
      title: "In Stock",
      value: stats.inStockCount,
      icon: <PackageCheck className="h-4 w-4 text-green-500" />,
      description: "Items above minimum stock"
    },
    {
      title: "Low Stock",
      value: stats.lowStockCount,
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      description: "Items at or below minimum stock"
    },
    {
      title: "Out of Stock",
      value: stats.outOfStockCount,
      icon: <PackageMinus className="h-4 w-4 text-red-500" />,
      description: "Items with zero stock"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              {card.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
