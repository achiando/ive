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
import { Eye, MoreHorizontal, Pencil, Trash2, Check, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MaintenanceWithRelations } from "@/types/maintenance";
import { deleteMaintenance } from "@/lib/actions/maintenance";
import { MaintenanceStatus } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface CellActionProps {
  data: MaintenanceWithRelations;
  onUpdateStatus: (id: string, status: MaintenanceStatus) => Promise<any>;
  onAssignTechnician: (id: string, assignedToId: string | null) => Promise<any>;
  onGetTechnicians: () => Promise<Array<{ id: string; firstName: string; lastName: string; email: string }>>;
}

export const CellAction: React.FC<CellActionProps> = ({
  data,
  onUpdateStatus,
  onAssignTechnician,
  onGetTechnicians,
}) => {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUpdateStatusDialog, setShowUpdateStatusDialog] = useState(false);
  const [showAssignTechnicianDialog, setShowAssignTechnicianDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<MaintenanceStatus>(data.status);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(data.assignedToId || null);
  const [technicians, setTechnicians] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([]);
  const [technicianSearchTerm, setTechnicianSearchTerm] = useState('');
  const [isFetchingTechnicians, setIsFetchingTechnicians] = useState(false);

  useEffect(() => {
    if (showAssignTechnicianDialog) {
      const fetchTechnicians = async () => {
        setIsFetchingTechnicians(true);
        try {
          const fetchedTechnicians = await onGetTechnicians();
          setTechnicians(fetchedTechnicians);
        } catch (error) {
          console.error("Failed to fetch technicians:", error);
          toast.error("Failed to load technicians.");
        } finally {
          setIsFetchingTechnicians(false);
        }
      };
      fetchTechnicians();
    }
  }, [showAssignTechnicianDialog, onGetTechnicians]);

  const handleDelete = async () => {
    setIsLoading(true);
    const result = await deleteMaintenance(data.id);
    setIsLoading(false);

    if (result.success) {
      toast.success("Maintenance record deleted successfully.");
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setShowDeleteDialog(false);
  };

  const handleUpdateStatus = async () => {
    setIsLoading(true);
    const result = await onUpdateStatus(data.id, newStatus);
    setIsLoading(false);

    if (result.success) {
      toast.success("Maintenance status updated successfully.");
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setShowUpdateStatusDialog(false);
  };

  const handleAssignTechnician = async () => {
    setIsLoading(true);
    const result = await onAssignTechnician(data.id, selectedTechnicianId);
    setIsLoading(false);

    if (result.success) {
      toast.success("Technician assigned successfully.");
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setShowAssignTechnicianDialog(false);
  };

  const filteredTechnicians = technicians.filter(tech =>
    `${tech.firstName} ${tech.lastName} ${tech.email}`.toLowerCase().includes(technicianSearchTerm.toLowerCase())
  );

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
          <DropdownMenuItem onClick={() => router.push(`/maintenance/${data.id}`)}>
            <span className="flex items-center">
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowUpdateStatusDialog(true)}>
            <span className="flex items-center">
              <Check className="h-4 w-4 mr-2" /> Update Status
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowAssignTechnicianDialog(true)}>
            <span className="flex items-center">
              <UserPlus className="h-4 w-4 mr-2" /> Assign Technician
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 hover:!text-red-600"
          >
            <span className="flex items-center">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this maintenance record and cannot be undone.
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

      {/* Update Status Dialog */}
      <AlertDialog open={showUpdateStatusDialog} onOpenChange={setShowUpdateStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Maintenance Status</AlertDialogTitle>
            <AlertDialogDescription>
              Select the new status for this maintenance record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={(value: MaintenanceStatus) => setNewStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MaintenanceStatus).map(status => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateStatus} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Status'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Technician Dialog */}
      <AlertDialog open={showAssignTechnicianDialog} onOpenChange={setShowAssignTechnicianDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Technician</AlertDialogTitle>
            <AlertDialogDescription>
              Select a technician to assign to this maintenance record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <Input
              placeholder="Search technicians..."
              value={technicianSearchTerm}
              onChange={(e) => setTechnicianSearchTerm(e.target.value)}
            />
            <Select value={selectedTechnicianId || ''} onValueChange={(value: string) => setSelectedTechnicianId(value === '' ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                {isFetchingTechnicians ? (
                  <SelectItem value="" disabled>Loading...</SelectItem>
                ) : (
                  <>
                    <SelectItem value="">Unassign</SelectItem>
                    {filteredTechnicians.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.firstName} {tech.lastName} ({tech.email})
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAssignTechnician} disabled={isLoading}>
              {isLoading ? 'Assigning...' : 'Assign'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
