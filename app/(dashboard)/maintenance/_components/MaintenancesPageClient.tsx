"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { columns } from "./columns"; // This will be created next
import { MaintenanceWithRelations } from "@/types/maintenance";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaintenanceStatus, MaintenanceType } from "@prisma/client";

interface MaintenancesPageClientProps {
  maintenances: MaintenanceWithRelations[];
  onUpdateStatus: (id: string, status: MaintenanceStatus) => Promise<any>;
  onAssignTechnician: (id: string, assignedToId: string | null) => Promise<any>;
  onGetTechnicians: () => Promise<Array<{ id: string; firstName: string; lastName: string; email: string }>>;
}

export function MaintenancesPageClient({
  maintenances,
  onUpdateStatus,
  onAssignTechnician,
  onGetTechnicians,
}: MaintenancesPageClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | "all">("all");
  const [selectedType, setSelectedType] = useState<string | "all">("all");

  const isLoading = !maintenances;

  const filteredMaintenances = useMemo(() => {
    let currentMaintenances = maintenances;

    if (searchTerm) {
      currentMaintenances = currentMaintenances.filter(
        (maintenance) =>
          maintenance.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          maintenance.equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          maintenance.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== "all") {
      currentMaintenances = currentMaintenances.filter((maintenance) => maintenance.status === selectedStatus);
    }

    if (selectedType !== "all") {
      currentMaintenances = currentMaintenances.filter((maintenance) => maintenance.type === selectedType);
    }

    return currentMaintenances;
  }, [maintenances, searchTerm, selectedStatus, selectedType]);

  const renderFilters = (showSearchInput: boolean) => (
    <Fragment>
      {showSearchInput && (
        <Input
          placeholder="Search by title, equipment, description..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="max-w-sm"
        />
      )}
      <div className="flex space-x-2">
        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={(value: string | "all") => setSelectedStatus(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(MaintenanceStatus).map(status => (
              <SelectItem key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={selectedType} onValueChange={(value: string | "all") => setSelectedType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.values(MaintenanceType).map(type => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Fragment>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Records</h1>
          <p className="text-muted-foreground">
            Manage and track all equipment maintenance records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/maintenance/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Schedule Maintenance
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <DataTable
        columns={columns(onUpdateStatus, onAssignTechnician, onGetTechnicians)}
        data={filteredMaintenances}
        filterColumnId="title" 
        filterColumnPlaceholder="Filter by title..." 
      >
        {renderFilters(true)}
      </DataTable>
    </div>
  );
}
