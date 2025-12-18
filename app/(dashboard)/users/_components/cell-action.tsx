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
import { deleteUser, updateUserStatus } from "@/lib/actions/user";
import type { RegistrationStatus, User } from "@prisma/client";
import { Check, MoreHorizontal, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CellActionProps {
  data: User;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    const result = await deleteUser(data.id);
    setIsLoading(false);
    
    if (result.success) {
      router.refresh();
    } else {
      alert(result.message);
    }
    setShowDeleteDialog(false);
  };

  const handleStatusUpdate = async (status: RegistrationStatus) => {
    setIsLoading(true);
    const result = await updateUserStatus(data.id, status);
    setIsLoading(false);
    
    if (result.success) {
      router.refresh();
    } else {
      alert(result.message);
    }
  };

  const isPending = data.status === 'PENDING';

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
          <DropdownMenuItem onClick={() => router.push(`/users/${data.id}`)}>
            <span className="flex items-center">
              <span className="mr-2">✏️</span> Edit
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/users/${data.id}/view`)}>
            <span className="flex items-center">
              <span className="mr-2">👁️</span> View
            </span>
          </DropdownMenuItem>
          
          {isPending && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleStatusUpdate('APPROVED')}
                className="text-green-600 hover:!text-green-600"
              >
                <span className="flex items-center">
                  <Check className="h-4 w-4 mr-2" /> Approve
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusUpdate('REJECTED')}
                className="text-amber-600 hover:!text-amber-600"
              >
                <span className="flex items-center">
                  <X className="h-4 w-4 mr-2" /> Reject
                </span>
              </DropdownMenuItem>
            </>
          )}

          {data.status !== 'SUSPENDED' && data.status !== 'PENDING' && ( // Only show suspend if not pending and not already suspended
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleStatusUpdate('SUSPENDED')}
                className="text-orange-600 hover:!text-orange-600"
              >
                <span className="flex items-center">
                  <X className="h-4 w-4 mr-2" /> Suspend
                </span>
              </DropdownMenuItem>
            </>
          )}
          
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
              This will permanently delete {data.firstName} {data.lastName}'s account and cannot be undone.
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