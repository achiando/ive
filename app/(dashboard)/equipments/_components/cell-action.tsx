"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteEquipment, updateEquipmentStatus } from "@/lib/actions/equipment";
import { EquipmentStatus, EquipmentWithRelations } from "@/types/equipment";
import { Check, Eye, MoreHorizontal, Pencil, Trash2, Wrench } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface CellActionProps {
  data: EquipmentWithRelations;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    const result = await deleteEquipment(data.id);
    setIsLoading(false);

    if (result.success) {
      toast.success("Equipment deleted successfully.");
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setShowDeleteDialog(false);
  };

  const handleStatusUpdate = async (status: EquipmentStatus) => { // Changed type to EquipmentStatus
    setIsLoading(true);
    const result = await updateEquipmentStatus(data.id, status);
    setIsLoading(false);

    if (result.success) {
      toast.success(`Equipment status updated to ${status}.`);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const isAvailable = data.status === EquipmentStatus.AVAILABLE;
  const isInUse = data.status === EquipmentStatus.IN_USE;
  const isMaintenance = data.status === EquipmentStatus.MAINTENANCE;
  const { data: session } = useSession();
  const canAddEquipment = [
    'TECHNICIAN',
    'ADMIN_TECHNICIAN',
    'LAB_MANAGER',
    'ADMIN'
  ].includes(session?.user?.role || '');

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(data.id)}>
            <span className="flex items-center">
              <span className="mr-2">📋</span> Copy ID
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {
            canAddEquipment && (
              <DropdownMenuItem onClick={() => router.push(`/equipments/${data.id}`)}>
                <span className="flex items-center">
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </span>
              </DropdownMenuItem>
            )
          }
          <DropdownMenuItem onClick={() => router.push(`/assessment?equipmentId=${data.id}`)}>
            <span className="flex items-center">
              <Eye className="h-4 w-4 mr-2" /> Take Assessment
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/equipments/${data.id}/view`)}>
            <span className="flex items-center">
              <Eye className="h-4 w-4 mr-2" /> View
            </span>
          </DropdownMenuItem>
          {
            canAddEquipment && (
              <>
                <DropdownMenuSeparator />
                {!isAvailable && (
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate(EquipmentStatus.AVAILABLE)}
                    className="text-green-600 hover:!text-green-600"
                  >
                    <span className="flex items-center">
                      <Check className="h-4 w-4 mr-2" /> Mark Available
                    </span>
                  </DropdownMenuItem>
                )}
                {!isInUse && (
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate(EquipmentStatus.IN_USE)}
                    className="text-blue-600 hover:!text-blue-600"
                  >
                    <span className="flex items-center">
                      <Check className="h-4 w-4 mr-2" /> Mark In Use
                    </span>
                  </DropdownMenuItem>
                )}
                {!isMaintenance && (
                  <DropdownMenuItem
                    onClick={() => {
                      handleStatusUpdate(EquipmentStatus.MAINTENANCE);
                      window.location.href = `/maintenance/new?equipmentId=${data.id}`;
                    }}
                    className="text-yellow-600 hover:!text-yellow-600"
                  >
                    <span className="flex items-center">
                      <Wrench className="h-4 w-4 mr-2" /> Mark for Maintenance
                    </span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:!text-destructive"
                >
                  <span className="flex items-center">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </span>
                </DropdownMenuItem></>
            )
          }


        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the equipment "{data.name}" and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};