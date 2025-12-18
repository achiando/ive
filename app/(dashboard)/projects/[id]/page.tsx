
import { getProjectById } from "@/lib/actions/project";
import { notFound } from "next/navigation";
import { ProjectForm } from "../_components/ProjectForm";

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const isNewProject = id === 'new';
  let initialData = undefined;

  if (!isNewProject) {
    initialData = await getProjectById(id);
    if (!initialData) {
      notFound();
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <ProjectForm initialData={initialData} projectId={isNewProject ? undefined : id} />
    </div>
  );
}
