// types/consumable.ts
import { Consumable as PrismaConsumable, ConsumableAllocation as PrismaConsumableAllocation, Equipment as PrismaEquipment, User as PrismaUser } from '@prisma/client';

export type ConsumableWithRelations = PrismaConsumable & {
  allocations?: PrismaConsumableAllocation[];
  equipment?: PrismaEquipment[];
};

export type ConsumableAllocationWithRelations = PrismaConsumableAllocation & {
  consumable: PrismaConsumable;
  user?: PrismaUser; // If you want to include the user who made the allocation
  // You might also want to include booking or maintenance details if they are linked
};
