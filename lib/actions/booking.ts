"use server"

import { authOptions } from '@/lib/auth';
import {
  sendBookingApprovedEmail,
  sendBookingCancelledEmail,
  sendBookingConfirmationEmail,
  sendBookingRejectedEmail,
} from '@/lib/email';
import { prisma } from '@/lib/prisma';
import {
  BookingAnalyticsData,
  BookingDetails,
  BookingStatus
} from '@/types/booking';
import { Prisma, UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';

// Helper to combine a Date object and a time string (HH:mm) into a single Date object
const combineDateTime = (date: Date, time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

// Helper to format booking details for consistent output
const formatBookingDetails = (booking: any): BookingDetails => {
  const now = new Date();
  const isPast = booking.endDate < now;
  const isUpcoming = booking.startDate > now;

  // Create a new object without the prototype to ensure no methods are included
  const formattedBooking = { ...booking };
  
  // Convert Decimal values to numbers
  if (formattedBooking.equipment) {
    if (formattedBooking.equipment.purchasePrice) {
      formattedBooking.equipment.purchasePrice = Number(formattedBooking.equipment.purchasePrice);
    }
    if (formattedBooking.equipment.estimatedPrice) {
      formattedBooking.equipment.estimatedPrice = Number(formattedBooking.equipment.estimatedPrice);
    }
    if (formattedBooking.equipment.actualPrice) {
      formattedBooking.equipment.actualPrice = Number(formattedBooking.equipment.actualPrice);
    }
  }

  return {
    ...formattedBooking,
    isPast,
    isUpcoming,
    user: formattedBooking.user ? { 
      ...formattedBooking.user, 
      name: `${formattedBooking.user.firstName} ${formattedBooking.user.lastName}` 
    } : null,
  };
};

// Helper to check equipment availability
async function checkBookingAvailability(
  equipmentId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const overlappingBookings = await prisma.equipmentBooking.findMany({
    where: {
      equipmentId,
      AND: [
        {
          startDate: { lt: endDate },
        },
        {
          endDate: { gt: startDate },
        },
      ],
      NOT: excludeBookingId ? { id: excludeBookingId } : undefined,
      status: {
        notIn: [BookingStatus.REJECTED, BookingStatus.CANCELLED],
      },
    },
  });
  return overlappingBookings.length === 0;
}

interface CreateBookingData {
  equipmentId: string;
  startDate: Date;
  endDate: Date;
  bookingHours: number;
  bookingTime: string;
  purpose: string;
  notes?: string;
  projectId?: string;
  userId: string;
}

interface UpdateBookingData {
  status?: BookingStatus;
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  checkedOut?: boolean;
  checkedIn?: boolean;
  checkedOutAt?: Date;
  checkedInAt?: Date;
  isReminderSent?: boolean;
  // Allow updating other fields if necessary, e.g., dates, purpose
  startDate?: Date;
  endDate?: Date;
  bookingHours?: number;
  bookingTime?: string;
  purpose?: string;
}

interface GetBookingsParams {
  userId?: string;
  projectId?: string;
  status?: BookingStatus;
  isPast?: boolean;
  isUpcoming?: boolean;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  equipmentId?: string;
}

export async function getBookingAnalytics(): Promise<BookingAnalyticsData> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }

  const user = session.user as { id: string; role: UserRole };

  // Base where clause for authorization
  const whereClause: Prisma.EquipmentBookingWhereInput = {};
  const isAdminRole = (role: UserRole): boolean => {
    return role === UserRole.ADMIN || role === UserRole.LAB_MANAGER || role === UserRole.ADMIN_TECHNICIAN;
  };

  if (!isAdminRole(user.role)) {
    whereClause.OR = [
      { userId: user.id },
      {
        project: {
          OR: [
            { creatorId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
      },
    ];
  }

  try {
    // Total Bookings
    const totalBookings = await prisma.equipmentBooking.count({
      where: whereClause,
    });

    // Bookings by Status
    const bookingsByStatus = await prisma.equipmentBooking.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
      where: whereClause,
    });

    // Bookings by Equipment (Top 5)
    const bookingsByEquipment = await prisma.equipmentBooking.groupBy({
      by: ['equipmentId'],
      _count: {
        equipmentId: true,
      },
      orderBy: {
        _count: {
          equipmentId: 'desc',
        },
      },
      take: 5,
      where: whereClause,
    });

    const equipmentNames = await prisma.equipment.findMany({
      where: {
        id: {
          in: bookingsByEquipment.map(b => b.equipmentId),
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const formattedBookingsByEquipment = bookingsByEquipment.map(item => ({
      equipmentName: equipmentNames.find(e => e.id === item.equipmentId)?.name || 'Unknown Equipment',
      count: item._count.equipmentId,
    }));

    // Bookings by User (Top 5)
    const bookingsByUser = await prisma.equipmentBooking.groupBy({
      by: ['userId'],
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 5,
      where: whereClause,
    });

    const userDetails = await prisma.user.findMany({
      where: {
        id: {
          in: bookingsByUser.map(b => b.userId),
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const formattedBookingsByUser = bookingsByUser.map(item => ({
      userName: userDetails.find(u => u.id === item.userId)?.firstName + ' ' + userDetails.find(u => u.id === item.userId)?.lastName || 'Unknown User',
      count: item._count.userId,
    }));

    // Average Booking Duration (in hours)
    const totalDurationResult = await prisma.equipmentBooking.aggregate({
      _sum: {
        bookingHours: true,
      },
      where: whereClause,
    });
    const totalBookingHours = totalDurationResult._sum.bookingHours || 0;
    const averageBookingDuration = totalBookings > 0 ? totalBookingHours / totalBookings : 0;

    // Peak Booking Times (Hourly)
    const allBookings = await prisma.equipmentBooking.findMany({
      where: whereClause,
      select: {
        startDate: true,
      },
    });

    const peakBookingTimesMap = new Map<number, number>();
    allBookings.forEach(booking => {
      const hour = booking.startDate.getHours();
      peakBookingTimesMap.set(hour, (peakBookingTimesMap.get(hour) || 0) + 1);
    });

    const peakBookingTimes = Array.from(peakBookingTimesMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour); // Sort by hour

    return {
      totalBookings,
      bookingsByStatus: bookingsByStatus.map(item => ({
        status: item.status as BookingStatus,
        count: item._count.status,
      })),
      bookingsByEquipment: formattedBookingsByEquipment,
      bookingsByUser: formattedBookingsByUser,
      averageBookingDuration,
      peakBookingTimes,
    };
  } catch (error) {
    console.error('Error fetching booking analytics:', error);
    throw new Error('Failed to fetch booking analytics.');
  }
}

export async function createBooking(data: CreateBookingData): Promise<BookingDetails> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }

  const user = session.user as { id: string; role: UserRole };
  const isAdminRole = (role: UserRole): boolean => {
    return role === UserRole.ADMIN || role === UserRole.LAB_MANAGER || role === UserRole.ADMIN_TECHNICIAN || role === UserRole.TECHNICIAN;
  };

  // If the user is not an admin role, they can only create bookings for themselves
  if (!isAdminRole(user.role) && data.userId !== user.id) {
    throw new Error('Forbidden: You can only create bookings for your own user ID.');
  }

  const { equipmentId, startDate, endDate, bookingHours, bookingTime, purpose, notes, projectId, userId } = data;

  const startDateTime = combineDateTime(startDate, bookingTime);
  const endDateTime = new Date(startDateTime);
  endDateTime.setHours(startDateTime.getHours() + bookingHours);

  // Ensure end date is not before start date
  if (endDateTime < startDateTime) {
    throw new Error('End time cannot be before start time.');
  }

  // Check for overlapping bookings
  const isAvailable = await checkBookingAvailability(equipmentId, startDateTime, endDateTime);
  if (!isAvailable) {
    throw new Error('Equipment is not available for the selected time slot.');
  }

  try {
    const newBooking = await prisma.equipmentBooking.create({
      data: {
        userId,
        equipmentId,
        projectId,
        startDate: startDateTime,
        endDate: endDateTime,
        bookingHours,
        bookingTime,
        purpose,
        notes,
        status: BookingStatus.APPROVED, // New bookings are auto-approved
      },
      include: {
        equipment: true,
        project: true,
        user: true,
      },
    });

    // Send confirmation email
    if (newBooking.user?.email) {
      const bookingLink = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${newBooking.id}`;
      await sendBookingConfirmationEmail({
        userName: `${newBooking.user.firstName} ${newBooking.user.lastName}`,
        userEmail: newBooking.user.email,
        equipmentName: newBooking.equipment.name,
        projectName: newBooking.project?.title,
        startDate: newBooking.startDate,
        endDate: newBooking.endDate,
        purpose: newBooking.purpose,
        bookingLink,
      });
    }

    revalidatePath('/dashboard/bookings');
    if (projectId) {
      revalidatePath(`/dashboard/projects/${projectId}/bookings`);
    }
    revalidatePath(`/dashboard/equipments/${equipmentId}`);

    return formatBookingDetails(newBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    throw new Error('Failed to create booking.');
  }
}

export async function getBookingById(bookingId: string): Promise<BookingDetails | null> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }

  try {
    const booking = await prisma.equipmentBooking.findUnique({
      where: { id: bookingId },
      include: {
        equipment: true,
        project: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        },
        user: true,
      },
    });

    if (!booking) {
      return null;
    }

    // Authorization check: Only allow access to own bookings, or if user is admin/manager/technician
    const user = session.user as { id: string; role: UserRole };
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.LAB_MANAGER, UserRole.ADMIN_TECHNICIAN, UserRole.TECHNICIAN];
    const hasAccess =
      booking.userId === user.id ||
      booking.project?.creatorId === user.id || // Project creator can see
      (booking.project?.members && booking.project.members.some(member => member.userId === user.id)) ||
      allowedRoles.includes(user.role);

    if (!hasAccess) {
      throw new Error('Forbidden: You do not have access to this booking.');
    }

    return formatBookingDetails(booking);
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    throw new Error('Failed to fetch booking.');
  }
}

export async function getBookings(params: GetBookingsParams = {}): Promise<{ data: BookingDetails[]; total: number }> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }

  const { userId, projectId, status, isPast, isUpcoming, searchQuery, page = 1, pageSize = 10, equipmentId } = params;
  const skip = (page - 1) * pageSize;

  const user = session.user as { id: string; role: UserRole };

  const where: Prisma.EquipmentBookingWhereInput = {};

  // Type guard to check if a role is an admin role
  const isAdminRole = (role: UserRole): boolean => {
    return role === UserRole.ADMIN || role === UserRole.LAB_MANAGER || role === UserRole.ADMIN_TECHNICIAN;
  };

  // Filter by current user's bookings or projects they are involved in
  if (!isAdminRole(user.role)) {
    where.OR = [
      { userId: user.id },
      {
        project: {
          OR: [
            { creatorId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
      },
    ];
  } else if (userId) {
    // If an admin/manager explicitly filters by userId
    where.userId = userId;
  }

  if (projectId) {
    where.projectId = projectId;
  }
  if (status) {
    where.status = status;
  }
  if (equipmentId) {
    where.equipmentId = equipmentId;
  }

  if (searchQuery) {
    where.OR = [
      ...(where.OR || []), // Preserve existing OR conditions
      { purpose: { contains: searchQuery, mode: 'insensitive' } },
      { notes: { contains: searchQuery, mode: 'insensitive' } },
      { equipment: { name: { contains: searchQuery, mode: 'insensitive' } } },
      { project: { title: { contains: searchQuery, mode: 'insensitive' } } },
      { user: { firstName: { contains: searchQuery, mode: 'insensitive' } } },
      { user: { lastName: { contains: searchQuery, mode: 'insensitive' } } },
    ];
  }

  const now = new Date();

  if (isPast !== undefined) {
    if (isPast) {
      where.endDate = { lt: now };
    } else {
      where.endDate = { gte: now };
    }
  }

  if (isUpcoming !== undefined) {
    if (isUpcoming) {
      where.startDate = { gt: now };
    } else {
      where.startDate = { lte: now };
    }
  }

  try {
    const bookings = await prisma.equipmentBooking.findMany({
      where,
      include: {
        equipment: true,
        project: {
          include: {
            members: true, // Needed for authorization check
          },
        },
        user: true,
      },
      orderBy: {
        startDate: 'desc',
      },
      skip,
      take: pageSize,
    });

    const total = await prisma.equipmentBooking.count({ where });

    const formattedBookings = bookings.map(formatBookingDetails);

    return {
      data: formattedBookings,
      total,
    };
  } catch (error: any) {
    console.error('Error fetching bookings:', error.message, error.stack);
    throw new Error('Failed to fetch bookings.');
  }
}

export async function updateBooking(bookingId: string, data: UpdateBookingData): Promise<BookingDetails> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }

  const user = session.user as { id: string; role: UserRole };

  try {
    const existingBooking = await prisma.equipmentBooking.findUnique({
      where: { id: bookingId },
      include: {
        equipment: true,
        project: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        user: true,
      },
    });

    if (!existingBooking) {
      throw new Error('Booking not found.');
    }
    const allowedRoles = [UserRole.ADMIN, UserRole.LAB_MANAGER, UserRole.ADMIN_TECHNICIAN, UserRole.TECHNICIAN] as const;
    const hasAccess =
      existingBooking.userId === user.id ||
      existingBooking.project?.creatorId === user.id || // Project creator can see
      (existingBooking.project?.members && existingBooking.project.members.some(member => member.userId === user.id)) ||
      (allowedRoles as readonly string[]).includes(user.role);

    if (!hasAccess) {
      throw new Error('Forbidden: You do not have access to this booking.');
    }

    // If status is being updated, ensure only authorized roles can do it
    if (data.status && data.status !== existingBooking.status) {
      const allowedStatusChangeRoles: UserRole[] = [UserRole.ADMIN, UserRole.LAB_MANAGER, UserRole.ADMIN_TECHNICIAN, UserRole.TECHNICIAN];
      if (!allowedStatusChangeRoles.includes(user.role)) {
        throw new Error('Forbidden: You do not have permission to change booking status.');
      }
      data.approvedBy = user.id;
      data.approvedAt = new Date();
    }

    // If dates or times are updated, re-check availability
    if (data.startDate || data.endDate || data.bookingTime || data.bookingHours) {
      const newStartDate = data.startDate || existingBooking.startDate;
      const newBookingTime = data.bookingTime || existingBooking.bookingTime;
      const newBookingHours = data.bookingHours || existingBooking.bookingHours;

      if (newBookingTime === null || newBookingTime === undefined || newBookingHours === null || newBookingHours === undefined) {
        throw new Error('Booking time and hours are required for date/time updates.');
      }

      const newStartDateTime = combineDateTime(newStartDate, newBookingTime);
      const newEndDateTime = new Date(newStartDateTime);
      newEndDateTime.setHours(newStartDateTime.getHours() + newBookingHours);

      const isAvailable = await checkBookingAvailability(existingBooking.equipmentId, newStartDateTime, newEndDateTime, bookingId);
      if (!isAvailable) {
        throw new Error('Equipment is not available for the updated time slot.');
      }
      data.startDate = newStartDateTime;
      data.endDate = newEndDateTime;
      data.bookingTime = newBookingTime;
      data.bookingHours = newBookingHours;
    }

    const updatedBooking = await prisma.equipmentBooking.update({
      where: { id: bookingId },
      data: {
        ...data,
      },
      include: {
        equipment: true,
        project: true,
        user: true,
      },
    });

    // Send email notifications for status changes
    if (data.status && data.status !== existingBooking.status && updatedBooking.user?.email) {
      const bookingLink = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${updatedBooking.id}`;
      const emailDetails = {
        userName: `${updatedBooking.user.firstName} ${updatedBooking.user.lastName}`,
        userEmail: updatedBooking.user.email,
        equipmentName: updatedBooking.equipment.name,
        projectName: updatedBooking.project?.title,
        startDate: updatedBooking.startDate,
        endDate: updatedBooking.endDate,
        purpose: updatedBooking.purpose,
        bookingLink,
        reason: data.notes, // Use notes as reason for rejection
      };

      switch (data.status) {
        case BookingStatus.APPROVED:
          await sendBookingApprovedEmail(emailDetails);
          break;
        case BookingStatus.REJECTED:
          await sendBookingRejectedEmail(emailDetails);
          break;
        case BookingStatus.CANCELLED:
          await sendBookingCancelledEmail(emailDetails);
          break;
        default:
          break;
      }
    }

    revalidatePath('/dashboard/bookings');
    if (existingBooking.projectId) {
      revalidatePath(`/dashboard/projects/${existingBooking.projectId}/bookings`);
    }
    revalidatePath(`/dashboard/equipments/${existingBooking.equipmentId}`);

    return formatBookingDetails(updatedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    throw new Error('Failed to update booking.');
  }
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  reason?: string
): Promise<{ success: boolean; message?: string }> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, message: 'Unauthorized' };
  }

  const user = session.user as { id: string; role: UserRole };

  try {
    const existingBooking = await prisma.equipmentBooking.findUnique({
      where: { id: bookingId },
      include: {
        equipment: true,
        project: true,
        user: true,
      },
    });

    if (!existingBooking) {
      return { success: false, message: 'Booking not found.' };
    }

    // Authorization check: Only allow status updates by admin/manager/technician
    const canChangeStatus: UserRole[] = [UserRole.ADMIN, UserRole.LAB_MANAGER, UserRole.ADMIN_TECHNICIAN, UserRole.TECHNICIAN];
    if (!canChangeStatus) {
      return { success: false, message: 'Forbidden: You do not have permission to change booking status.' };
    }

    const updatedBooking = await prisma.equipmentBooking.update({
      where: { id: bookingId },
      data: {
        status: newStatus,
        approvedBy: newStatus === BookingStatus.APPROVED ? user.id : existingBooking.approvedBy,
        approvedAt: newStatus === BookingStatus.APPROVED ? new Date() : existingBooking.approvedAt,
        notes: reason ? `${existingBooking.notes || ''} (Reason: ${reason})` : existingBooking.notes, // Append reason to notes
      },
      include: {
        equipment: true,
        project: true,
        user: true,
      },
    });

    // Send email notifications for status changes
    if (updatedBooking.user?.email) {
      const bookingLink = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${updatedBooking.id}`;
      const emailDetails = {
        userName: `${updatedBooking.user.firstName} ${updatedBooking.user.lastName}`,
        userEmail: updatedBooking.user.email,
        equipmentName: updatedBooking.equipment.name,
        projectName: updatedBooking.project?.title,
        startDate: updatedBooking.startDate,
        endDate: updatedBooking.endDate,
        purpose: updatedBooking.purpose,
        bookingLink,
        reason: reason,
      };

      switch (newStatus) {
        case BookingStatus.APPROVED:
          await sendBookingApprovedEmail(emailDetails);
          break;
        case BookingStatus.REJECTED:
          await sendBookingRejectedEmail(emailDetails);
          break;
        case BookingStatus.CANCELLED:
          await sendBookingCancelledEmail(emailDetails);
          break;
        default:
          break;
      }
    }

    revalidatePath('/dashboard/bookings');
    if (existingBooking.projectId) {
      revalidatePath(`/dashboard/projects/${existingBooking.projectId}/bookings`);
    }
    revalidatePath(`/dashboard/equipments/${existingBooking.equipmentId}`);

    return { success: true, message: 'Booking status updated successfully.' };
  } catch (error) {
    console.error('Error updating booking status:', error);
    return { success: false, message: 'Failed to update booking status.' };
  }
}

export async function deleteBooking(bookingId: string): Promise<{ success: boolean; message?: string }> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, message: 'Unauthorized' };
  }

  const user = session.user as { id: string; role: UserRole };

  try {
    const existingBooking = await prisma.equipmentBooking.findUnique({
      where: { id: bookingId },
      include: {
        project: true,
      },
    });

    if (!existingBooking) {
      return { success: false, message: 'Booking not found.' };
    }

    // Authorization check: Only allow deletion by booking owner, project creator, or admin/manager/technician
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.LAB_MANAGER, UserRole.ADMIN_TECHNICIAN, UserRole.TECHNICIAN];
    const hasAccess =
      existingBooking.userId === user.id ||
      existingBooking.project?.creatorId === user.id ||
      (allowedRoles as readonly string[]).includes(user.role);

    if (!hasAccess) {
      return { success: false, message: 'Forbidden: You do not have permission to delete this booking.' };
    }

    await prisma.equipmentBooking.delete({
      where: { id: bookingId },
    });

    revalidatePath('/dashboard/bookings');
    if (existingBooking.projectId) {
      revalidatePath(`/dashboard/projects/${existingBooking.projectId}/bookings`);
    }
    revalidatePath(`/dashboard/equipments/${existingBooking.equipmentId}`);

    return { success: true, message: 'Booking deleted successfully.' };
  } catch (error) {
    console.error('Error deleting booking:', error);
    return { success: false, message: 'Failed to delete booking.' };
  }
}
















