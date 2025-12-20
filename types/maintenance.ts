// types/maintenance.ts
import { Maintenance as PrismaMaintenance } from '@prisma/client';

export type MaintenanceWithRelations = PrismaMaintenance & {
  equipment: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  consumableAllocations: Array<{
    id: string;
    maintenanceId: string | null; // Changed to allow null
    consumableId: string;
    quantity: number;
    consumable: {
      id: string;
      name: string;
      unit: string | null;
    };
  }>;
};
