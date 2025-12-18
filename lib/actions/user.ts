
"use server";

import { sendStatusUpdateEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { RegistrationStatus, User } from "@prisma/client";
import { unstable_cache as cache } from "next/cache";

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
      include: {
        _count: {
          select: {
            projectMemberships: true,
            equipmentBookings: true,
          },
        },
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
  async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        faculty: true,
      },
    });
    return user;
  },
  ["user_by_id"],
  { revalidate: 3600 }
);

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
      events: { include: { event: true } },
      equipment: { include: { equipment: true } },
    },
  });

  if (!user) {
    return { events: [], equipment: [] };
  }

  return {
    events: user.events.map((p) => p.event),
    equipment: user.equipment.map((b) => b.equipment),
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

    revalidatePath(`/status/pending`);
    return { success: true, message: "Selections updated successfully." };
  } catch (error) {
    console.error("Error updating user selections:", error);
    return { success: false, message: "Failed to update selections." };
  }
}
