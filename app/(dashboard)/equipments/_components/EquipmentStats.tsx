"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EquipmentWithRelations } from "@/types/equipment";
import { CheckCircle, Clock, ListIcon, Wrench } from "lucide-react";


interface AnalyticsCardsProps {
  equipments: EquipmentWithRelations[];
  isLoading: boolean;
}

export const EquipmentStats = ({ equipments, isLoading }: AnalyticsCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const totalEquipment = equipments.length;
  const availableCount = equipments.filter(eq => eq.status === 'AVAILABLE').length;
  const inUseCount = equipments.filter(eq => eq.status === 'IN_USE').length;
  const maintenanceCount = equipments.filter(eq => eq.status === 'MAINTENANCE').length;
  const needsAttentionCount = equipments.filter(eq => 
    eq.status === 'MAINTENANCE' || 
    eq.maintenances.some(m => m.status === 'PENDING' || m.status === 'CANCELLED')
  ).length;

  const stats = {
    totalEquipment,
    availableCount,
    inUseCount,
    maintenanceCount,
    needsAttentionCount
  };

  const cards = [
    {
      title: "Total Equipment",
      value: stats.totalEquipment,
      icon: <ListIcon className="h-4 w-4 text-muted-foreground" />,
      description: "Total items in inventory"
    },
    {
      title: "Available",
      value: stats.availableCount,
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      description: "Ready to be booked"
    },
    {
      title: "In Use",
      value: stats.inUseCount,
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      description: "Currently in use"
    },
    {
      title: "Needs Attention",
      value: stats.needsAttentionCount,
      icon: <Wrench className="h-4 w-4 text-yellow-500" />,
      description: "Requires maintenance"
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
