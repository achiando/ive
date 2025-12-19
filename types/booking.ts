import { BookingStatus as PrismaBookingStatus, ProjectStatus, UserRole } from '@prisma/client';

export { PrismaBookingStatus as BookingStatus }; // Export Prisma's enum directly

export interface BookingDetails {
  id: string;
  equipmentId: string;
  userId: string;
  projectId: string | null;
  startDate: Date;
  endDate: Date;
  status: PrismaBookingStatus;
  purpose: string | null;
  notes: string | null;
  isReminderSent: boolean;
  bookingHours: number | null;
  bookingTime: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Derived properties for UI (to be calculated in frontend or API response)
  isPast: boolean;
  isUpcoming: boolean;

  // Relations
  equipment: {
    id: string;
    name: string;
    model: string | null;
    serialNumber: string | null;
    status: string; // Equipment status
    location: string | null;
    image: string | null;
  };
  project?: {
    id: string;
    title: string;
    status: ProjectStatus;
    creatorId: string;
    members?: Array<{
      userId: string;
      // Add other member properties if they exist
    }>;
  } | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    name: string; // Derived from firstName and lastName
  } | null;
}

export interface BookingAnalyticsData {
  totalBookings: number;
  bookingsByStatus: { status: PrismaBookingStatus; count: number }[];
  bookingsByEquipment: { equipmentName: string; count: number }[];
  bookingsByUser: { userName: string; count: number }[];
  averageBookingDuration: number; // in hours
  peakBookingTimes: { hour: number; count: number }[];
}
