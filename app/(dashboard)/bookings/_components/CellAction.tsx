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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingDetails, BookingStatus } from "@/types/booking";
import { UserRole } from "@prisma/client";
import { Check, MoreHorizontal, PackageSearch, Pencil, Trash2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { RejectBookingDialog } from "./RejectBookingDialog";

interface CellActionProps {
  data: BookingDetails;
  onUpdateBookingStatus: (id: string, status: BookingStatus, reason?: string) => Promise<{ success: boolean; message?: string }>;
  onDeleteBooking: (id: string) => Promise<void>;
}

export const CellAction: React.FC<CellActionProps> = ({
  data,
  onUpdateBookingStatus,
  onDeleteBooking,
}) => {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUpdateStatusDialog, setShowUpdateStatusDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<BookingStatus>(data.status);

  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isManagerOrAdmin = userRole === UserRole.LAB_MANAGER || userRole === UserRole.ADMIN;
  const isTechnician = userRole === UserRole.TECHNICIAN || userRole === UserRole.ADMIN_TECHNICIAN;

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDeleteBooking(data.id);
      toast.success("Booking deleted successfully.");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete booking.");
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleUpdateStatus = async () => {
    setIsLoading(true);
    try {
      const result = await onUpdateBookingStatus(data.id, newStatus);
      if (result.success) {
        toast.success("Booking status updated successfully.");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update booking status.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update booking status.");
    } finally {
      setIsLoading(false);
      setShowUpdateStatusDialog(false);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    setIsLoading(true);
    try {
      const result = await onUpdateBookingStatus(data.id, BookingStatus.REJECTED, reason);
      if (result.success) {
        toast.success("Booking rejected successfully.");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to reject booking.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to reject booking.");
    } finally {
      setIsLoading(false);
      setShowRejectDialog(false);
    }
  };

  const canManage = isManagerOrAdmin || isTechnician;
  const canEdit = canManage || data.userId === session?.user?.id; // User can edit their own booking
  const canDelete = canManage || data.userId === session?.user?.id; // User can delete their own booking

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
          {canEdit && (
            <DropdownMenuItem onClick={() => router.push(`/bookings/${data.id}`)}>
              <span className="flex items-center">
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </span>
            </DropdownMenuItem>
            
          )}
           <DropdownMenuItem onClick={() => router.push(`/consumables/allocations/new?bookingId=${data.id}`)}>
              <span className="flex items-center">
                <PackageSearch className="h-4 w-4 mr-2" /> Allocate Consumables
              </span>
            </DropdownMenuItem>

          {canManage && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowUpdateStatusDialog(true)}>
                <span className="flex items-center">
                  <Check className="h-4 w-4 mr-2" /> Update Status
                </span>
              </DropdownMenuItem>
              {data.status !== BookingStatus.REJECTED && data.status !== BookingStatus.CANCELLED && (
                <DropdownMenuItem onClick={() => setShowRejectDialog(true)}>
                  <span className="flex items-center">
                    <X className="h-4 w-4 mr-2" /> Reject
                  </span>
                </DropdownMenuItem>
              )}
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
              This will permanently delete this booking record and cannot be undone.
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
            <AlertDialogTitle>Update Booking Status</AlertDialogTitle>
            <AlertDialogDescription>
              Select the new status for this booking record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={(value: BookingStatus) => setNewStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(BookingStatus).map(status => (
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

      {/* Reject Booking Dialog */}
      <RejectBookingDialog
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={handleRejectConfirm}
        bookingId={data.id}
        equipmentName={data.equipment?.name}
        userName={data.user?.name}
        isLoading={isLoading}
      />
    </>
  );
};
