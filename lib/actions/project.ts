'use server';

import { Project, ProjectMember, ProjectDocument, User, ProjectStatus, RegistrationStatus, UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';
import { prisma } from '../prisma';
import { ProjectWithDetails } from '@/types/project';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Form schema for validation (re-using from the UI component for consistency)
const projectFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED', 'REJECTED']).default('DRAFT'),
  userEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  projectImage: z.any().optional(), // File type is handled separately
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export async function fetchUserProjects(): Promise<ProjectWithDetails[]> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  if (!userId) {
    throw new Error("User not authenticated.");
  }

  let projects: ProjectWithDetails[] = [];

  if (userRole === UserRole.ADMIN || userRole === UserRole.LAB_MANAGER || userRole === UserRole.TECHNICIAN || userRole === UserRole.ADMIN_TECHNICIAN) {
    // Fetch all projects for privileged roles
    projects = await prisma.project.findMany({
      include: {
        creator: true,
        members: {
          include: {
            user: true,
          },
        },
        documents: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } else {
    // Fetch projects where the user is a member or creator
    projects = await prisma.project.findMany({
      where: {
        OR: [
          { creatorId: userId },
          {
            members: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      include: {
        creator: true,
        members: {
            include: {
                user: true,
            },
        },
        documents: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  return projects;
}

export async function getProjectById(projectId: string): Promise<ProjectWithDetails | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  if (!userId) {
    throw new Error("User not authenticated.");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      creator: true,
      members: {
        include: {
          user: true,
        },
      },
      documents: true,
    },
  });

  if (!project) {
    return null;
  }

  // Check if the user is authorized to view this project
  const isCreator = project.creatorId === userId;
  const isMember = project.members.some(member => member.userId === userId);
  const isPrivileged = userRole === UserRole.ADMIN || userRole === UserRole.LAB_MANAGER || userRole === UserRole.TECHNICIAN || userRole === UserRole.ADMIN_TECHNICIAN;

  if (!isCreator && !isMember && !isPrivileged) {
    throw new Error("Not authorized to view this project.");
  }

  return project;
}

export async function createProject(data: ProjectFormValues): Promise<ProjectWithDetails> {
  const session = await getServerSession(authOptions);
  const creatorId = session?.user?.id;
  const userRole = session?.user?.role;

  if (!creatorId) {
    throw new Error("User not authenticated.");
  }

  const validatedData = projectFormSchema.omit({ userEmail: true, projectImage: true }).parse(data);

  let assignedUserId: string | undefined;
  if (data.userEmail) {
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.LAB_MANAGER) {
      throw new Error("Only Admins or Lab Managers can assign projects to other users.");
    }
    const assignedUser = await prisma.user.findUnique({
      where: { email: data.userEmail },
    });
    if (!assignedUser) {
      throw new Error("Assigned user not found.");
    }
    assignedUserId = assignedUser.id;
  }

  const projectStatus: ProjectStatus = (userRole === UserRole.ADMIN || userRole === UserRole.LAB_MANAGER) && data.status
    ? data.status
    : ProjectStatus.PENDING_APPROVAL;

  const newProject = await prisma.project.create({
    data: {
      title: validatedData.title,
      description: validatedData.description || null,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      status: projectStatus,
      creatorId: assignedUserId || creatorId, // If assigned, use assignedUserId, otherwise use creatorId
      members: {
        create: [
          {
            userId: creatorId, // Creator is always a member
            role: 'CREATOR',
            status: 'ACCEPTED',
          },
          ...(assignedUserId && assignedUserId !== creatorId
            ? [{ userId: assignedUserId, role: 'MEMBER', status: 'ACCEPTED' }]
            : []),
        ],
      },
    },
    include: {
      creator: true,
      members: {
        include: {
          user: true,
        },
      },
      documents: true,
    },
  });

  return newProject;
}

export async function updateProject(projectId: string, data: Partial<ProjectFormValues>): Promise<ProjectWithDetails> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  if (!userId) {
    throw new Error("User not authenticated.");
  }

  const existingProject = await prisma.project.findUnique({
    where: { id: projectId },
    select: { creatorId: true },
  });

  if (!existingProject) {
    throw new Error("Project not found.");
  }

  const isCreator = existingProject.creatorId === userId;
  const isPrivileged = userRole === UserRole.ADMIN || userRole === UserRole.LAB_MANAGER;

  if (!isCreator && !isPrivileged) {
    throw new Error("Not authorized to update this project.");
  }

  const validatedData = projectFormSchema.partial().omit({ userEmail: true, projectImage: true }).parse(data);

  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: {
      title: validatedData.title,
      description: validatedData.description,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
      status: (isPrivileged && validatedData.status) ? validatedData.status : undefined, // Only privileged users can change status
    },
    include: {
      creator: true,
      members: {
        include: {
          user: true,
        },
      },
      documents: true,
    },
  });

  return updatedProject;
}

export async function deleteProject(projectId: string): Promise<void> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  if (!userId) {
    throw new Error("User not authenticated.");
  }

  const existingProject = await prisma.project.findUnique({
    where: { id: projectId },
    select: { creatorId: true },
  });

  if (!existingProject) {
    throw new Error("Project not found.");
  }

  const isCreator = existingProject.creatorId === userId;
  const isPrivileged = userRole === UserRole.ADMIN || userRole === UserRole.LAB_MANAGER;

  if (!isCreator && !isPrivileged) {
    throw new Error("Not authorized to delete this project.");
  }

  await prisma.project.delete({
    where: { id: projectId },
  });
}

export async function addProjectDocument(projectId: string, url: string, fileType?: string): Promise<ProjectDocument> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("User not authenticated.");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { creatorId: true, members: { select: { userId: true } } },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const isCreator = project.creatorId === userId;
  const isMember = project.members.some(member => member.userId === userId);

  if (!isCreator && !isMember) {
    throw new Error("Not authorized to add documents to this project.");
  }

  const newDocument = await prisma.projectDocument.create({
    data: {
      projectId,
      url,
      fileType,
    },
  });
  return newDocument;
}

export async function deleteProjectDocument(documentId: string): Promise<void> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("User not authenticated.");
  }

  const document = await prisma.projectDocument.findUnique({
    where: { id: documentId },
    include: { project: { select: { creatorId: true, members: { select: { userId: true } } } } },
  });

  if (!document) {
    throw new Error("Document not found.");
  }

  const isCreator = document.project.creatorId === userId;
  const isMember = document.project.members.some(member => member.userId === userId);

  if (!isCreator && !isMember) {
    throw new Error("Not authorized to delete this document.");
  }

  await prisma.projectDocument.delete({
    where: { id: documentId },
  });
}

export async function getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("User not authenticated.");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { creatorId: true, members: { select: { userId: true } } },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const isCreator = project.creatorId === userId;
  const isMember = project.members.some(member => member.userId === userId);

  if (!isCreator && !isMember) {
    throw new Error("Not authorized to view documents for this project.");
  }

  const documents = await prisma.projectDocument.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });
  return documents;
}

export async function generateProjectInviteToken(projectId: string): Promise<string> {
  const session = await getServerSession(authOptions);
  const invitedById = session?.user?.id;

  if (!invitedById) {
    throw new Error("User not authenticated.");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { creatorId: true, members: { select: { userId: true } } },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const isCreator = project.creatorId === invitedById;
  // Only creator can generate invite links
  if (!isCreator) {
    throw new Error("Only the project creator can generate invite links.");
  }

  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Token valid for 7 days

  await prisma.projectMember.create({
    data: {
      projectId,
      invitedById,
      status: 'INVITED',
      token,
      expiresAt,
    },
  });

  return token;
}

export async function joinProjectWithToken(token: string, userId: string): Promise<ProjectMember> {
  if (!userId) {
    throw new Error("User not authenticated.");
  }

  const projectMember = await prisma.projectMember.findUnique({
    where: { token },
    include: { project: true },
  });

  if (!projectMember) {
    throw new Error("Invalid or expired invite token.");
  }

  if (projectMember.expiresAt && projectMember.expiresAt < new Date()) {
    throw new Error("Invite token has expired.");
  }

  if (projectMember.userId) {
    throw new Error("This invite link has already been used.");
  }

  // Check if the user is already a member of this project
  const existingMembership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: projectMember.projectId,
        userId: userId,
      },
    },
  });

  if (existingMembership) {
    throw new Error("You are already a member of this project.");
  }

  const updatedProjectMember = await prisma.projectMember.update({
    where: { id: projectMember.id },
    data: {
      userId: userId,
      status: 'PENDING_APPROVAL', // User joins, but needs approval
      joinedAt: new Date(),
      token: null, // Invalidate token after use
      expiresAt: null,
    },
  });

  return updatedProjectMember;
}

export async function updateProjectMemberStatus(memberId: string, status: 'ACCEPTED' | 'REJECTED' | 'REVOKED'): Promise<ProjectMember> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  if (!userId) {
    throw new Error("User not authenticated.");
  }

  const projectMember = await prisma.projectMember.findUnique({
    where: { id: memberId },
    include: { project: true },
  });

  if (!projectMember) {
    throw new Error("Project member not found.");
  }

  const isProjectCreator = projectMember.project.creatorId === userId;
  const isPrivileged = userRole === UserRole.ADMIN || userRole === UserRole.LAB_MANAGER;

  if (!isProjectCreator && !isPrivileged) {
    throw new Error("Not authorized to update project member status.");
  }

  const updatedMember = await prisma.projectMember.update({
    where: { id: memberId },
    data: { status },
  });

  return updatedMember;
}

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  if (!userId) {
    throw new Error("User not authenticated.");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { creatorId: true, members: { select: { userId: true } } },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const isCreator = project.creatorId === userId;
  const isMember = project.members.some(member => member.userId === userId);
  const isPrivileged = userRole === UserRole.ADMIN || userRole === UserRole.LAB_MANAGER;

  if (!isCreator && !isMember && !isPrivileged) {
    throw new Error("Not authorized to view project members.");
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: true, invitedBy: true },
  });

  return members;
}

export async function removeProjectMember(memberId: string): Promise<void> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  if (!userId) {
    throw new Error("User not authenticated.");
  }

  const projectMember = await prisma.projectMember.findUnique({
    where: { id: memberId },
    include: { project: true },
  });

  if (!projectMember) {
    throw new Error("Project member not found.");
  }

  const isProjectCreator = projectMember.project.creatorId === userId;
  const isPrivileged = userRole === UserRole.ADMIN || userRole === UserRole.LAB_MANAGER;

  // A user can remove themselves, or a creator/privileged user can remove any member
  if (projectMember.userId !== userId && !isProjectCreator && !isPrivileged) {
    throw new Error("Not authorized to remove this project member.");
  }

  await prisma.projectMember.delete({
    where: { id: memberId },
  });
}