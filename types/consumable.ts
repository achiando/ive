// types/consumable.ts
import { Consumable as PrismaConsumable, ConsumableAllocation as PrismaConsumableAllocation, User as PrismaUser } from '@prisma/client';

export type ConsumableWithRelations = PrismaConsumable & {
  allocations?: PrismaConsumableAllocation[];
  equipment?: { id: string; name: string; }[];
};

export type ConsumableAllocationWithRelations = PrismaConsumableAllocation & {
  consumable: PrismaConsumable;
  user?: PrismaUser; // If you want to include the user who made the allocation
  // You might also want to include booking or maintenance details if they are linked
};

export interface ConsumableAllocationFormData {
  consumableId: string;
  quantity: number;
  purpose: string;
  allocatedDate: Date;
  bookingId?: string | null;
  maintenanceId?: string | null;
}
