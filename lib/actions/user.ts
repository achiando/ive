
"use server";

import { authOptions } from "@/lib/auth";
import { sendStatusUpdateEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { Faculty, RegistrationStatus, User } from "@prisma/client";
import { getServerSession } from "next-auth";
import { unstable_cache as cache, revalidatePath } from 'next/cache';

/**
 * Fetches all users from the database.
 * Caches the result for 1 hour.
 */
export const getUsers = cache(
  async (status?: RegistrationStatus) => {
    const users = await prisma.user.findMany({
      where: status ? { status } : {},
      orderBy: {
        createdAt: "desc",
      },
    });
    return users;
  },
  ["users_with_counts"],
  { revalidate: 3600 } // Revalidate every hour
);

/**
 * Fetches a user by their ID.
 * Caches the result for 1 hour.
 */
export const getUserById = cache(
  async (id: string | undefined | null) => {
    if (!id) {
      console.error('No user ID provided to getUserById');
      return null;
    }
    
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          faculty: true,
        },
      });
      return user;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  },
  ["user_by_id"],
  { revalidate: 3600 }
) as (id: string | undefined | null) => Promise<(User & { faculty: Faculty | null }) | null>;

/**
 * Fetches the currently authenticated user's profile with extended details.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        faculty: true,
        _count: {
          select: {
            projects: true,
            equipmentBookings: true,
            projectMemberships: true,
            eventParticipations: true,
          },
        },
        equipmentBookings: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            equipment: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            startDate: 'asc',
          },
          where: {
            endDate: {
              gte: new Date(), // Only upcoming bookings
            },
          },
          take: 3, // Limit to 3 upcoming bookings
        },
        projectMemberships: {
          select: {
            project: {
              select: {
                id: true,
                title: true,
                status: true,
                startDate: true,
                endDate: true,
              },
            },
          },
          orderBy: {
            project: {
              startDate: 'desc',
            },
          },
          take: 3, // Limit to 3 recent projects
        },
      },
    });

    if (!user) {
      return null;
    }

    // Flatten projectMemberships to include project details directly
    const recentProjects = user.projectMemberships.map(pm => pm.project);

    // Return user data with flattened projects and bookings
    return {
      ...user,
      recentProjects,
      projectMemberships: undefined, // Remove the original projectMemberships to avoid redundancy
    };
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    return null;
  }
}

/**
 * Calculates the number of new users per month.
 * Caches the result for 1 hour.
 */
export const getMonthlyUserCounts = cache(
  async () => {
    const users = await getUsers();
    const monthlyCounts: { [key: string]: { name: string; total: number } } = {};

    users.forEach((user) => {
      const month = new Date(user.createdAt).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (!monthlyCounts[month]) {
        monthlyCounts[month] = { name: month, total: 0 };
      }
      monthlyCounts[month].total += 1;
    });

    return Object.values(monthlyCounts);
  },
  ["monthly_user_counts"],
  { revalidate: 3600 }
);

/**
 * Creates a new user.
 */
export async function createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">) {
  const user = await prisma.user.create({
    data,
  });
  return user;
}

/**
 * Updates an existing user.
 */
export async function updateUser(id: string, data: Partial<User>) {
  const user = await prisma.user.update({
    where: { id },
    data,
  });
  return user;
}

/**
 * Updates the current user's profile.
 * This function is intended for users to update their own non-sensitive profile information.
 */
export async function updateMyProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string | null;
    department?: string | null;
    position?: string | null;
    profileImage?: string | null;
    employeeId?: string | null;
    studentId?: string | null;
    yearOfStudy?: number | null;
    program?: string | null;
  }
) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        department: data.department,
        position: data.position,
        profileImage: data.profileImage,
        employeeId: data.employeeId,
        studentId: data.studentId,
        yearOfStudy: data.yearOfStudy,
        program: data.program,
        updatedAt: new Date(), // Manually update updatedAt
      },
    });
    revalidatePath('/me'); // Revalidate the profile page
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, message: 'Failed to update profile.' };
  }
}

/**
 * Deletes a user by their ID.
 */
export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      message: 'Failed to delete user',
    };
  }
}

/**
 * Updates a user's status (e.g., PENDING, APPROVED, REJECTED)
 * @param id - The ID of the user to update
 * @param status - The new status to set
 * @returns A promise that resolves to an object indicating success or failure
 */
export async function updateUserStatus(
  id: string,
  status: RegistrationStatus,
  message?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    // Validate the status is a valid RegistrationStatus
    if (!Object.values(RegistrationStatus).includes(status)) {
      return {
        success: false,
        message: 'Invalid status provided',
      };
    }

    // Get the current user data
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    if (!currentUser) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Only proceed with the update if the status is actually changing
    if (currentUser.status !== status) {
      await prisma.user.update({
        where: { id },
        data: { status },
      });

      // Send email notification about the status change
      try {
        await sendStatusUpdateEmail(
          currentUser.email,
          `${currentUser.firstName} ${currentUser.lastName}`,
          status,
          message
        );
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
        // Don't fail the whole operation if email sending fails
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user status:', error);
    return {
      success: false,
      message: 'Failed to update user status',
    };
  }
}

/**
 * Sends a custom email to a user.
 */
export async function sendCustomEmail(to: string, subject: string, html: string) {
  "use server";
  const { sendEmail } = await import("@/lib/email"); // Dynamic import for server action
  try {
    const success = await sendEmail({ to, subject, html });
    if (!success) {
      throw new Error("Failed to send email.");
    }
    return { success: true, message: "Email sent successfully." };
  } catch (error) {
    console.error("Error sending custom email:", error);
    return { success: false, message: "Failed to send email." };
  }
}


/**
 * Fetches the count of users by their registration status.
 */
export const getUserStatusCounts = cache(
  async () => {
    const counts = await prisma.user.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    // Initialize all statuses with 0
    const statusCounts: { [key in RegistrationStatus]: number } = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      SUSPENDED: 0,
    };

    // Populate counts from the database query
    counts.forEach(item => {
      if (item.status) {
        statusCounts[item.status] = item._count.status;
      }
    });

    return statusCounts;
  },
  ['user_status_counts'],
  { revalidate: 3600 }
);

export async function getUserSelections(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      eventParticipations: { 
        include: { 
          event: true 
        } 
      },
      equipment: true, // Direct relation to equipment
    },
  });

  if (!user) {
    return { events: [], equipment: [] };
  }

  // Type the participation object
  type Participation = {
    event: {
      id: string;
      name: string;
      description: string | null;
      startDate: Date;
      endDate: Date;
      location: string | null;
      venue: string | null;
      maxParticipants: number | null;
      createdById: string;
      imageUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
  };

  return {
    events: (user as any).eventParticipations?.map((p: Participation) => p.event) || [],
    equipment: user.equipment || [],
  };
}

export async function updateUserSelections(
  userId: string,
  eventIds: string[],
  equipmentIds: string[]
) {
  try {
    await prisma.$transaction(async (tx) => {
      // Clear existing selections
      await tx.eventParticipation.deleteMany({ where: { userId } });
      await tx.equipmentBooking.deleteMany({ where: { userId } });

      // Add new event selections
      if (eventIds.length > 0) {
        await tx.eventParticipation.createMany({
          data: eventIds.map((eventId) => ({
            userId,
            eventId,
            status: "REGISTERED",
          })),
        });
      }

      // Add new equipment selections
      if (equipmentIds.length > 0) {
        await tx.equipmentBooking.createMany({
          data: equipmentIds.map((equipmentId) => ({
            userId,
            equipmentId,
            // You might need to define start and end dates for bookings
            // For now, this is a simplified version.
            startDate: new Date(),
            endDate: new Date(),
            status: "PENDING",
          })),
        });
      }
    });

    revalidatePath(`/pending`);
    return { success: true, message: "Selections updated successfully." };
  } catch (error) {
    console.error("Error updating user selections:", error);
    return { success: false, message: "Failed to update selections." };
  }
}
