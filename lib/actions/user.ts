
"use server";

import { authOptions } from "@/lib/auth";
import { sendEmail, sendStatusUpdateEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { Faculty, Prisma, RegistrationStatus, User, UserRole } from "@prisma/client";
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { unstable_cache as cache, revalidateTag } from 'next/cache';

// Helper function to generate a random password
function generateRandomPassword(length = 10) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Fetches all users from the database.
 * Caches the result for 1 hour.
 */
export const getUsers = cache(
  async (status?: RegistrationStatus, roles?: UserRole[]) => {
    const whereClause: Prisma.UserWhereInput = {};

    if (status) {
      whereClause.status = status;
    }
    if (roles && roles.length > 0) {
      whereClause.role = { in: roles };
    }

    return prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });
  },
  ["users"], // cache key
  {
    tags: ["users"], // ✅ THIS enables revalidateTag
    revalidate: 3600,
  }
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
  {
    tags: ["users", "user"], // ✅ depends on users
    revalidate: 3600,
  }
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
  ["user_status_counts"],
  {
    tags: ["users"], // ✅ same tag
    revalidate: 3600,
  }
);

/**
 * Creates a new user.
 */
export async function createUser(data: Omit<User, "id" | "createdAt" | "updatedAt" | "password"> & { password?: string }) {
  const rawPassword = data.password || generateRandomPassword();
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
  });

  // Send email to the new user with their password
  try {
    const emailSubject = "Your Account Details for IVE Platform";
    const emailHtml = `
      <p>Dear ${user.firstName},</p>
      <p>Your account has been created on the IVE Platform.</p>
      <p>Your login details are:</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Password:</strong> ${rawPassword}</p>
      <p>Please log in and change your password as soon as possible.</p>
      <p>Thank you,</p>
      <p>IVE Team</p>
    `;
    await sendEmail({ to: user.email, subject: emailSubject, html: emailHtml });
  } catch (emailError) {
    console.error('Failed to send welcome email to new user:', emailError);
    // Don't fail the whole operation if email sending fails
  }

  revalidateTag("users", "default"); // Revalidate the users list cache
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
  revalidateTag("users", "default"); // Revalidate the users list cache
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
    revalidateTag("users", "default"); // Revalidate the users list cache with max revalidation profile
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
    revalidateTag("users", "default");
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
        revalidateTag("users", "default");
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
    revalidateTag("users", "default");

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

export const getTechnicianStatistics = cache(
  async () => {
    const technicianRoles = [UserRole.TECHNICIAN, UserRole.ADMIN_TECHNICIAN, UserRole.LAB_MANAGER];

    const baseWhere: Prisma.UserWhereInput = {
      role: { in: technicianRoles },
    };

    // Total count of technician-related users
    const totalTechnicians = await prisma.user.count({
      where: baseWhere,
    });

    // Counts by specific technician role
    const techniciansByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
      where: baseWhere,
    });

    // Counts by registration status for technician-related users
    const techniciansByStatus = await prisma.user.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
      where: baseWhere,
    });

    // Format results
    const roleCounts: { [key in UserRole]?: number } = {};
    techniciansByRole.forEach(item => {
      if (item.role) {
        roleCounts[item.role] = item._count.role;
      }
    });

    const statusCounts: { [key in RegistrationStatus]?: number } = {};
    techniciansByStatus.forEach(item => {
      if (item.status) {
        statusCounts[item.status] = item._count.status;
      }
    });

    return {
      totalTechnicians,
      techniciansByRole: roleCounts,
      techniciansByStatus: statusCounts,
    };
  },
  ["technician_statistics"],
  {
    tags: ["users"], // Revalidate when user data changes
    revalidate: 3600,
  }
);

