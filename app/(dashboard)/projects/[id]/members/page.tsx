import { getProjectById, getProjectMembers } from "@/lib/actions/project";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { ProjectMembersClient } from "./_components/ProjectMembersClient";

interface ProjectMembersPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectMembersPage({ params }: ProjectMembersPageProps) {
  const { id: projectId } = await params;

  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  const members = await getProjectMembers(projectId);

  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole;

  return (
    <div className="container mx-auto py-10 px-4">
      <ProjectMembersClient project={project} initialMembers={members} userRole={userRole} />
    </div>
  );
}
