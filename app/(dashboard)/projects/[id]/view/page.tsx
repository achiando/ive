import { getProjectById } from "@/lib/actions/project"; // Only import getProjectById
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { ProjectView } from "./_components/ProjectView";

interface ProjectViewPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectViewPage({ params }: ProjectViewPageProps) {
  const { id: projectId } = await params;

  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole;

  if (!session?.user?.id) {
    // Redirect to login or show unauthorized message if not authenticated
    // For now, we'll just throw an error or use notFound
    notFound(); 
  }

  const project = await getProjectById(projectId); // Fetch project details with all relations

  if (!project) {
    notFound();
  }

  // Placeholder for onAction function, will be implemented in client component
  const handleAction = async (action: string, data?: any) => {
    "use server";
    // This will be handled by client-side actions or API calls
    console.log(`Server-side action: ${action}`, data);
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <ProjectView 
        project={project} 
        userRole={userRole} 
        onAction={handleAction} 
        // initialDocuments and initialMembers are now part of the project object
      />
    </div>
  );
}