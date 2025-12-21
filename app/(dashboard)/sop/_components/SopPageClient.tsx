"use client"

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getEquipmentById } from "@/lib/actions/equipment"; // Import getEquipmentById
import { deleteSafetyTest } from "@/lib/actions/safety-test";
import { SafetyTestWithRelations } from "@/types/safety-test";
import { ManualType, SafetyTestFrequency, UserRole } from "@prisma/client";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { columns } from "./columns";

interface SopPageClientProps {
  initialSafetyTests: SafetyTestWithRelations[];
  equipmentId?: string; // New optional prop
}

const isAdminOrManager = (role: UserRole) => {
  // Check if the role is either 'TECHNICIAN' or 'LECTURER'
  return role === 'TECHNICIAN' || role === 'LECTURER';
};

export function SopPageClient({ initialSafetyTests, equipmentId }: SopPageClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [safetyTests, setSafetyTests] = useState(initialSafetyTests);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFrequency, setSelectedFrequency] = useState<SafetyTestFrequency | "all">("all");
  const [selectedManualType, setSelectedManualType] = useState<ManualType | "all">("all");
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]); // State to store equipment types

  const userRole = session?.user?.role;
  const canManageSOPs = userRole ? isAdminOrManager(userRole) : false;

  useEffect(() => {
    if (equipmentId) {
      const fetchEquipmentTypes = async () => {
        try {
          const equipment = await getEquipmentById(equipmentId);
          if (equipment && equipment.specifications && typeof equipment.specifications === 'object' && 'type' in equipment.specifications) {
            // Assuming 'type' in specifications is a string or array of strings
            const type = (equipment.specifications as any).type;
            setEquipmentTypes(Array.isArray(type) ? type : [type]);
          } else {
            setEquipmentTypes([]);
          }
        } catch (error) {
          console.error("Failed to fetch equipment details:", error);
          setEquipmentTypes([]);
        }
      };
      fetchEquipmentTypes();
    } else {
      setEquipmentTypes([]);
    }
  }, [equipmentId]);

  const filteredSafetyTests = useMemo(() => {
    let currentTests = safetyTests;

    if (equipmentId && equipmentTypes.length > 0) {
      currentTests = currentTests.filter(test =>
        test.associatedEquipmentTypes.some(type => equipmentTypes.includes(type))
      );
    }

    if (searchTerm) {
      currentTests = currentTests.filter(
        (test) =>
          test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          test.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          test.associatedEquipmentTypes.some(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedFrequency !== "all") {
      currentTests = currentTests.filter((test) => test.frequency === selectedFrequency);
    }

    if (selectedManualType !== "all") {
      currentTests = currentTests.filter((test) => test.manualType === selectedManualType);
    }

    return currentTests;
  }, [safetyTests, searchTerm, selectedFrequency, selectedManualType, equipmentId, equipmentTypes]);

  const handleDelete = async (id: string) => {
    try {
      await deleteSafetyTest(id);
      setSafetyTests((prev) => prev.filter((test) => test.id !== id));
      toast.success("SOP Manual deleted successfully!");
    } catch (error: any) {
      toast.error("Failed to delete SOP Manual.", {
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4 py-4">
         <Button variant="ghost" onClick={() => window.history.back()} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search SOPs..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex space-x-2">
          {/* Frequency Filter */}
          <Select value={selectedFrequency} onValueChange={(value: SafetyTestFrequency | "all") => setSelectedFrequency(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frequencies</SelectItem>
              {Object.values(SafetyTestFrequency).map((freq) => (
                <SelectItem key={freq} value={freq}>
                  {freq.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Manual Type Filter */}
          <Select value={selectedManualType} onValueChange={(value: ManualType | "all") => setSelectedManualType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Manual Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Manual Types</SelectItem>
              {Object.values(ManualType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canManageSOPs && (
            <Button onClick={() => router.push('/sop/new')}>
              <Plus className="mr-2 h-4 w-4" /> Add SOP
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredSafetyTests}
        filterColumnId="name"
        filterColumnPlaceholder="Filter by name..."
        meta={{
          onEdit: (safetyTest: SafetyTestWithRelations) => {
            router.push(`/dashboard/sop/${safetyTest.id}/edit`);
          },
          onDelete: handleDelete
        }}
      />
    </>
  );
}
