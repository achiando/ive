"use client"

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { getEquipmentById } from "@/lib/actions/equipment"; // Import getEquipmentById
import { deleteSafetyTest } from "@/lib/actions/safety-test";
import { SafetyTestWithRelations } from "@/types/safety-test";
import { ManualType, SafetyTestFrequency } from "@prisma/client";
import { ArrowLeft, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { columns } from "./columns";

interface SopPageClientProps {
  initialSafetyTests: SafetyTestWithRelations[];
  equipmentId?: string; // New optional prop
}

export function SopPageClient({ initialSafetyTests, equipmentId }: SopPageClientProps) {
  console.log("SopPageClient: initialSafetyTests", initialSafetyTests);
  const router = useRouter();
  const { data: session } = useSession();
  const [safetyTests, setSafetyTests] = useState(initialSafetyTests);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFrequency, setSelectedFrequency] = useState<SafetyTestFrequency | "all">("all");
  const [selectedManualType, setSelectedManualType] = useState<ManualType | "all">("all");
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]); // State to store equipment types


  const canManageSOPs = [
    'TECHNICIAN',
    'ADMIN_TECHNICIAN',
    'LAB_MANAGER',
    'ADMIN'
  ].includes(session?.user?.role || '');

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

      <div className="flex justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => window.history.back()} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            SOP Manuals
          </h1>
        </div>

        {
          canManageSOPs && (
            <div className=" py-4">

              <Button asChild>
                <Link href="/sop/new">
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Add SOP Manual
                </Link>
              </Button>

            </div>
          )
        }
      </div>


      <DataTable
        columns={columns}
        data={filteredSafetyTests}
        filterColumnId="name"
        filterColumnPlaceholder="Filter by name..."
        meta={{
          onEdit: (safetyTest: SafetyTestWithRelations) => {
            router.push(`/sop/${safetyTest.id}/edit`);
          },
          onDelete: handleDelete
        }}
      />
    </>
  );
}
