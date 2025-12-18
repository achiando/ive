"use server";

import { createProject, updateProject, ProjectFormValues } from "@/lib/actions/project";
import { redirect } from "next/navigation";
import { ProjectWithDetails } from "@/types/project";

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
