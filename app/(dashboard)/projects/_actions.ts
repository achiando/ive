"use server";

import { createProject, updateProject, ProjectFormValues, generateProjectInviteToken } from "@/lib/actions/project";
import { redirect } from "next/navigation";
import { ProjectWithDetails } from "@/types/project";
import { sendEmail } from "@/lib/email"; // Assuming this utility exists

export async function handleCreateProject(data: ProjectFormValues): Promise<ProjectWithDetails> {
  const project = await createProject(data);
  if (project?.id) {
    redirect(`/projects/${project.id}/documents`);
  }
  return project;
}

export async function handleUpdateProject(projectId: string, data: ProjectFormValues): Promise<ProjectWithDetails> {
  const project = await updateProject(projectId, data);
  if (project?.id) {
    redirect(`/projects/${project.id}/view`);
  }
  return project;
}

export async function sendProjectInvites(projectId: string, emails: string[], projectName: string, projectCreatorName: string): Promise<{ success: boolean; message?: string }> {
  if (!emails || emails.length === 0) {
    return { success: false, message: "No emails provided for invitation." };
  }

  const successfulInvites: string[] = [];
  const failedInvites: string[] = [];

  for (const email of emails) {
    try {
      // Generate invite token for each email
      const token = await generateProjectInviteToken(projectId); // This creates a ProjectMember entry with status 'INVITED'
      const inviteLink = `${process.env.NEXTAUTH_URL}/invite/${projectId}?token=${token}`;

      // Send email
      await sendEmail({
        to: email,
        subject: `Invitation to Project: ${projectName}`,
        html: `
          <p>Dear User,</p>
          <p>You have been invited by ${projectCreatorName} to join the project: <strong>${projectName}</strong>.</p>
          <p>To join the project, please click on the link below:</p>
          <p><a href="${inviteLink}">${inviteLink}</a></p>
          <p>This link is valid for 7 days.</p>
          <p>Best regards,</p>
          <p>The Project Team</p>
        `,
      });
      successfulInvites.push(email);
    } catch (error: any) {
      console.error(`Failed to send invite to ${email}:`, error);
      failedInvites.push(email);
    }
  }

  if (failedInvites.length > 0) {
    return {
      success: false,
      message: `Successfully sent invites to ${successfulInvites.length} users. Failed to send to: ${failedInvites.join(', ')}.`,
    };
  }

  return { success: true, message: `Successfully sent invites to ${successfulInvites.length} users.` };
}