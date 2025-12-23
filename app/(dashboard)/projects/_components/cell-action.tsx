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
import { useSession } from '@/hooks/useSession';
import { deleteProject, updateProject } from '@/lib/actions/project';
import { ProjectWithDetails } from '@/types/project';
import { ProjectStatus } from "@prisma/client";
import { Check, Edit, Eye, FileText, MoreHorizontal, Trash2, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
  data: ProjectWithDetails;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { isAdmin, isLabManager, user } = useSession();
  const isCreator = user?.id === data.creatorId;
  const isAdminOrManager = isAdmin || isLabManager;

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteProject(data.id);
      toast.success("Project deleted successfully.");
      router.refresh();
    } catch (error: any) {
      toast.error("Failed to delete project.", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleStatusUpdate = async (status: ProjectStatus) => {
    setIsLoading(true);
    try {
      await updateProject(data.id, { status });
      toast.success("Project status updated successfully.");
      router.refresh();
    } catch (error) {
      console.error("Failed to update project status:", error);
      toast.error("Failed to update project status.");
    } finally {
      setIsLoading(false);
    }
  };

  const canEdit = (isCreator || isAdminOrManager) && data.status !== ProjectStatus.REJECTED;
  const canDelete = (isCreator || isAdminOrManager); // Delete is always available for rejected projects
  const canChangeStatus = isAdminOrManager && data.status !== ProjectStatus.REJECTED;
  const canManageMembersAndDocuments = data.status !== ProjectStatus.REJECTED;
  const canManageBookings = data.status === ProjectStatus.APPROVED || data.status === ProjectStatus.COMPLETED;
  const canMakeBooking = data.status === ProjectStatus.APPROVED;

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
          <DropdownMenuItem onClick={() => router.push(`/projects/${data.id}/view`)}>
            <span className="flex items-center">
              <Eye className="h-4 w-4 mr-2" /> View
            </span>
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem onClick={() => router.push(`/projects/${data.id}`)}>
              <span className="flex items-center">
                <Edit className="h-4 w-4 mr-2" /> Edit
              </span>
            </DropdownMenuItem>
          )}

          {canManageMembersAndDocuments && (
            <>
              <DropdownMenuItem onClick={() => router.push(`/projects/${data.id}/members`)}>
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-2" /> Manage Members
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => router.push(`/projects/${data.id}/documents`)}>
                <span className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" /> Manage Documents
                </span>
              </DropdownMenuItem>
            </>
          )}

          {canManageBookings && (
            <>
              <DropdownMenuItem onClick={() => router.push(`/bookings?projectId=${data.id}`)}>
                <span className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" /> Manage Bookings
                </span>
              </DropdownMenuItem>
            </>
          )}
          {canMakeBooking && (
            <DropdownMenuItem onClick={() => router.push(`/bookings/new?projectId=${data.id}`)}>
              <span className="flex items-center">
                <FileText className="h-4 w-4 mr-2" /> Make Booking
              </span>
            </DropdownMenuItem>
          )}

          {canChangeStatus && data.status === ProjectStatus.PENDING && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleStatusUpdate(ProjectStatus.APPROVED)}
                className="text-green-600 hover:!text-green-600"
              >
                <span className="flex items-center">
                  <Check className="h-4 w-4 mr-2" /> Approve
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusUpdate(ProjectStatus.REJECTED)}
                className="text-amber-600 hover:!text-amber-600"
              >
                <span className="flex items-center">
                  <X className="h-4 w-4 mr-2" /> Reject
                </span>
              </DropdownMenuItem>
            </>
          )}

          {canChangeStatus && data.status === ProjectStatus.APPROVED && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleStatusUpdate(ProjectStatus.ARCHIVED)}
                className="text-orange-600 hover:!text-orange-600"
              >
                <span className="flex items-center">
                  <X className="h-4 w-4 mr-2" /> Archive
                </span>
              </DropdownMenuItem>
            </>
          )}

          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:!text-red-600"
              >
                <span className="flex items-center">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project "{data.title}" and all associated data. This action cannot be undone.
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