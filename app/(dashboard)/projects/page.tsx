import { fetchUserProjects } from "@/lib/actions/project";
import { ProjectsPageClient } from "./_components/ProjectsPageClient";

export default async function ProjectsPage() {
  const projects = await fetchUserProjects();

  return <ProjectsPageClient projects={projects} />;
}
