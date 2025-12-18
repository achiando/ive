import {
  Equipment as PrismaEquipment,
  EquipmentBooking as PrismaEquipmentBooking,
  Maintenance as PrismaMaintenance,
  Project as PrismaProject,
  ProjectMember as PrismaProjectMember, // Ensure this is imported
} from '@prisma/client';

// Export UserRole directly from Prisma client
export { PrismaUserRole as UserRole };

// EquipmentStatus enum for frontend consistency and validation
export enum EquipmentStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

// Redefine EquipmentWithRelations to correctly extend Prisma's Equipment and its relations
export type EquipmentWithRelations = PrismaEquipment & {
  bookings: PrismaEquipmentBooking[];
  maintenances: PrismaMaintenance[];
  // Add other relations as needed, e.g., users?: PrismaUser[]; safetyTests?: SafetyTest[];
};

// Define Project type based on usage in EquipmentView, directly from Prisma
export type Project = PrismaProject & {
  members?: (PrismaProjectMember & { user: PrismaUser | null })[]; // Correctly include the user relation
};

// The following interfaces were custom and are now replaced by Prisma's generated types or simplified
// export interface Booking { ... } // No longer needed, use PrismaEquipmentBooking
// export interface Maintenance { ... } // No longer needed, use PrismaMaintenance
// export interface SafetyTest { ... } // No longer needed, use PrismaSafetyTest
// export interface Equipment { ... } // No longer needed, use PrismaEquipment

// The following types were part of the extended EquipmentWithRelations but are not directly from Prisma
// If these are still needed, they should be added as separate types or properties to EquipmentWithRelations
// nextAvailable?: string | null;
// isOverdue?: boolean;
// purchasePrice: number;
// specifications: Record<string, unknown>;
// lastMaintenanceDate: string | null;
// nextMaintenanceDate: string | null;

export interface EquipmentTableProps {
  equipment: EquipmentWithRelations[];
  userRole: UserRole;
  onBookingSuccess?: () => void;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
}
