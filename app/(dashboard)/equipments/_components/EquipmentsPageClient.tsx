"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createEquipment } from "@/lib/actions/equipment";
import { EquipmentWithRelations } from "@/types/equipment";
import { UserRole } from "@prisma/client";
import { GridIcon, ListIcon, PlusCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getColumns } from "./columns"; // Import getColumns
import { EquipmentCard } from "./EquipmentCard";
import { EquipmentForm } from "./EquipmentForm";
import { EquipmentStats } from "./EquipmentStats";

interface EquipmentsPageClientProps {
  equipments: EquipmentWithRelations[];
  userRole: UserRole | undefined; // Add userRole prop
}

export function EquipmentsPageClient({ equipments, userRole }: EquipmentsPageClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const isLoading = !equipments;

  const filteredEquipments = useMemo(() => {
    let currentEquipments = equipments;

    if (searchTerm) {
      currentEquipments = currentEquipments.filter(
        (equipment) =>
          equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          equipment.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          equipment.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          equipment.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== "all") {
      currentEquipments = currentEquipments.filter((equipment) => equipment.status === selectedStatus);
    }

    if (selectedCategory !== "all") {
      currentEquipments = currentEquipments.filter((equipment) => equipment.category === selectedCategory);
    }

    return currentEquipments;
  }, [equipments, searchTerm, selectedStatus, selectedCategory]);

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    equipments.forEach(eq => categories.add(eq.category));
    return Array.from(categories);
  }, [equipments]);

  const handleCreateEquipment = async (values: any) => {
    const result = await createEquipment(values);
    if (result.success) {
      setIsCreateDialogOpen(false);
      router.refresh();
      toast.success("Equipment created successfully!");
    } else {
      toast.error(result.message);
    }
  };

  const { data: session } = useSession();
  const canAddEquipment = [
    'TECHNICIAN',
    'ADMIN_TECHNICIAN',
    'LAB_MANAGER',
    'ADMIN'
  ].includes(session?.user?.role || '');

  const renderFilters = (showSearchInput: boolean) => (
    <div className="w-full flex flex-col space-y-2">
      {/* {showSearchInput && (
        <Input
          placeholder="Search by name, model, serial..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full md:max-w-sm"
        />
      )} */}
      <div className="flex space-x-2">
        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={(value: string | "all") => setSelectedStatus(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="IN_USE">In Use</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={(value: string | "all") => setSelectedCategory(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {availableCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header with Add Equipment and View Toggles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipment Inventory</h1>
          <p className="text-muted-foreground">
            Manage and track all laboratory equipment
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canAddEquipment && (
            <>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Equipment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Equipment</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <EquipmentForm
                      onSubmit={handleCreateEquipment}
                      onCancel={() => setIsCreateDialogOpen(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={() => router.push('/equipments/bulk-upload')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Bulk Upload
              </Button>
              <Button variant="outline" onClick={() => router.push('/equipments/report')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Report
              </Button>
            </>
          )}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setView('table')}
              className={view === 'table' ? 'bg-accent' : ''}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setView('grid')}
              className={view === 'grid' ? 'bg-accent' : ''}
            >
              <GridIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <EquipmentStats
        equipments={filteredEquipments}
        isLoading={isLoading}
      />

      {/* Main Content Area */}
      {view === 'table' ? (
        <DataTable
          columns={getColumns(userRole as UserRole)} // Pass userRole to getColumns
          data={filteredEquipments}
          filterColumnId="name"
          filterColumnPlaceholder="Filter by name..."
          children={renderFilters(true)}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4 py-4">
            {renderFilters(true)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredEquipments.map((equipment) => (
              <EquipmentCard key={equipment.id} equipment={equipment} userRole={userRole as UserRole} /> 
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
