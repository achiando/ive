"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectWithDetails } from "@/types/project";
import { ProjectStatus, UserRole } from "@prisma/client";
import { LayoutGrid, Plus, Table } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { columns } from "./columns";
import { ProjectCard } from "./ProjectCard"; // Import ProjectCard

interface ProjectsPageClientProps {
  projects: ProjectWithDetails[];
}

export function ProjectsPageClient({ projects }: ProjectsPageClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | "all">("all");
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table'); // New state for view mode

  const isAdminOrManager = session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.LAB_MANAGER;

  const filteredProjects = useMemo(() => {
    let currentProjects = projects;

    // Apply search term filter
    if (searchTerm) {
      currentProjects = currentProjects.filter(
        (project) =>
          project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.creator.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.creator.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (selectedStatus !== "all") {
      currentProjects = currentProjects.filter((project) => project.status === selectedStatus);
    }

    return currentProjects;
  }, [projects, searchTerm, selectedStatus]);

  const handleProjectAction = (action: string, project: ProjectWithDetails) => {
    // This function can be used to trigger a refresh or other actions from ProjectCard
    if (action === 'refresh') {
      router.refresh();
    }
    // Add other actions as needed
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Projects
        </h1>
        <div className="flex justify-end items-center py-4">
          <div className='flex space-x-2'>
            {/* <Link href="/projects/analytics">
              <Button variant="outline" size="sm">
                View Detailed Reports
              </Button>
            </Link> */}
            <Button onClick={() => router.push('/projects/new')}>
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Filter, Search Bar and View Mode Toggle */}
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4 py-4">
        <Input
          placeholder="Search by title, description, creator..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex space-x-2">
          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={(value: ProjectStatus | "all") => setSelectedStatus(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.values(ProjectStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            aria-label="Toggle view mode"
          >
            {viewMode === 'table' ? <LayoutGrid className="h-4 w-4" /> : <Table className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <DataTable 
          columns={columns} 
          data={filteredProjects} 
          filterColumnId="title" 
          filterColumnPlaceholder="Filter by title..." 
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onAction={handleProjectAction}
              onClick={() => router.push(`/projects/${project.id}/view`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}