import { UserRole, SafetyTestFrequency, ManualType } from '@prisma/client';

// Form values for creating/updating a SafetyTest
export interface SafetyTestFormValues {
  name: string;
  description?: string;
  manualUrl?: string;
  manualType?: ManualType;
  requiredForRoles: UserRole[];
  associatedEquipmentTypes?: string[]; // Changed to array for multiple types
  frequency: SafetyTestFrequency;
}

// Interface for fetching safety tests with optional filters
export interface GetSafetyTestsParams {
  searchQuery?: string;
  associatedEquipmentType?: string;
  requiredForRole?: UserRole;
  frequency?: SafetyTestFrequency;
  page?: number;
  pageSize?: number;
}

// Extended SafetyTest type for UI display, including relations
export interface SafetyTestWithRelations {
  id: string;
  name: string;
  description: string | null;
  manualUrl: string | null;
  manualType: ManualType | null;
  requiredForRoles: UserRole[];
  associatedEquipmentTypes: string[]; // Changed to array for multiple types
  frequency: SafetyTestFrequency;
  createdAt: Date;
  updatedAt: Date;
  attempts: SafetyTestAttemptWithRelations[]; // Include attempts
}

// Extended SafetyTestAttempt type for UI display, including relations
export interface SafetyTestAttemptWithRelations {
  id: string;
  safetyTestId: string;
  userId: string;
  equipmentId: string;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  equipment: {
    id: string;
    name: string;
    serialNumber: string | null;
  };
  safetyTest: {
    id: string;
    name: string;
  };
}
