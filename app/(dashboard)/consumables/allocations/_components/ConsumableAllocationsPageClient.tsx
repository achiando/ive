"use client";

import { Button } from "@/components/ui/button"; // Import Button
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react"; // Import PlusCircle
import Link from "next/link"; // Import Link
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { columns } from "./columns"; // This will be created next

interface ConsumableAllocationsPageClientProps {
  allocations: any[]; // TODO: Define a proper type for ConsumableAllocationWithRelations
}

export function ConsumableAllocationsPageClient({ allocations }: ConsumableAllocationsPageClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const isLoading = !allocations; // Adjust based on actual loading state if data is fetched client-side

  const filteredAllocations = useMemo(() => {
    let currentAllocations = allocations;

    if (searchTerm) {
      currentAllocations = currentAllocations.filter(
        (allocation) =>
          allocation.consumable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          allocation.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          allocation.allocatedBy?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return currentAllocations;
  }, [allocations, searchTerm]);

  const renderFilters = (showSearchInput: boolean) => (
    <Fragment>
      {showSearchInput && (
        <Input
          placeholder="Search by consumable, purpose, allocated by..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="max-w-sm"
        />
      )}
    </Fragment>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consumable Allocations</h1>
          <p className="text-muted-foreground">
            View and manage all consumable allocations.
          </p>
        </div>
        <Button asChild>
          <Link href="/consumables/allocations/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Allocation
          </Link>
        </Button>
      </div>

      {/* Main Content Area */}
      <DataTable 
        columns={columns} 
        data={filteredAllocations}
        filterColumnId="consumable.name"
        filterColumnPlaceholder="Filter by consumable name..." 
      >
        {renderFilters(true)}
      </DataTable>
    </div>
  );
}
