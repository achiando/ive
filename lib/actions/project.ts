// lib/actions/project.ts
'use server';


import { Project } from '@/types/equipment'; // Assuming Project type is defined here or similar
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';
import { prisma } from '../prisma';

export async function fetchUserProjects(): Promise<Project[]> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  if (!userId) {
    throw new Error("User not authenticated.");
  }

  let projects: Project[] = [];

  if (userRole === UserRole.ADMIN || userRole === UserRole.LAB_MANAGER || userRole === UserRole.TECHNICIAN || userRole === UserRole.ADMIN_TECHNICIAN) {
    // Fetch all projects for privileged roles
    projects = await prisma.project.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  } else {
    // Fetch projects where the user is a member
    projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  // Map Prisma Project to your Project type if necessary
  // Assuming your Project type matches Prisma's Project structure for now
  return projects as Project[];
}
