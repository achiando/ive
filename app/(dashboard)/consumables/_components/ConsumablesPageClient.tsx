"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConsumableCategory } from "@prisma/client";
import { GridIcon, ListIcon, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import { createConsumable, getAllConsumables } from "@/lib/actions/consumable";
import { ConsumableForm, ConsumableFormValues } from "./ConsumableForm";
import { ConsumableStats } from "./ConsumableStats";
import { ConsumableCard } from "./ConsumableCard";
import { columns } from "./columns";

interface ConsumablesPageClientProps {
  consumables: any[]; // TODO: Define a proper type for ConsumableWithRelations
}

export function ConsumablesPageClient({ consumables }: ConsumablesPageClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const isLoading = !consumables; // Adjust based on actual loading state if data is fetched client-side

  const filteredConsumables = useMemo(() => {
    let currentConsumables = consumables;

    if (searchTerm) {
      currentConsumables = currentConsumables.filter(
        (consumable) =>
          consumable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          consumable.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          consumable.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      currentConsumables = currentConsumables.filter((consumable) => consumable.category === selectedCategory);
    }

    return currentConsumables;
  }, [consumables, searchTerm, selectedCategory]);

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    Object.values(ConsumableCategory).forEach(cat => categories.add(cat));
    return Array.from(categories);
  }, []);

  const handleCreateConsumable = async (values: ConsumableFormValues) => {
    const result = await createConsumable(values);
    if (result.success) {
      setIsCreateDialogOpen(false);
      router.refresh();
      toast.success("Consumable created successfully!");
    } else {
      toast.error(result.message);
    }
  };

  const renderFilters = (showSearchInput: boolean) => (
    <Fragment>
      {showSearchInput && (
        <Input
          placeholder="Search by name, location, supplier..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="max-w-sm"
        />
      )}
      <div className="flex space-x-2">
        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={(value: string | "all") => setSelectedCategory(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {availableCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Fragment>
  );

  return (
    <div className="space-y-8">
      {/* Header with Add Consumable and View Toggles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consumable Inventory</h1>
          <p className="text-muted-foreground">
            Manage and track all laboratory consumables
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Consumable
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Consumable</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <ConsumableForm 
                  onSubmit={handleCreateConsumable}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
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
      <ConsumableStats 
        consumables={filteredConsumables} 
        isLoading={isLoading} 
      />

      {/* Main Content Area */}
      {view === 'table' ? (
        <DataTable 
          columns={columns} 
          data={filteredConsumables}
          filterColumnId="name" 
          filterColumnPlaceholder="Filter by name..." 
        >
          {renderFilters(true)}
        </DataTable>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4 py-4">
            {renderFilters(true)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredConsumables.map((consumable) => (
              <ConsumableCard key={consumable.id} consumable={consumable} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
