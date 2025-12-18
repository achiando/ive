import { getProjectById, getProjectDocuments } from "@/lib/actions/project";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { ProjectDocumentsClient } from "./_components/ProjectDocumentsClient";

interface ProjectDocumentsPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectDocumentsPage({ params }: ProjectDocumentsPageProps) {
  const { id: projectId } = await params;

  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  const documents = await getProjectDocuments(projectId);

  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole;

  return (
    <div className="container mx-auto py-10 px-4">
      <ProjectDocumentsClient project={project} initialDocuments={documents} userRole={userRole} />
    </div>
  );
}
