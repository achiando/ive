"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface RejectBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  bookingId: string;
  equipmentName?: string | null;
  userName?: string | null;
  isLoading: boolean;
}

export function RejectBookingDialog({
  isOpen,
  onClose,
  onConfirm,
  bookingId,
  equipmentName,
  userName,
  isLoading,
}: RejectBookingDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Rejection reason cannot be empty.');
      return;
    }
    setError(null);
    try {
      await onConfirm(reason);
      setReason(''); // Clear reason on success
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reject booking.');
      toast.error(err.message || 'Failed to reject booking.');
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject Booking</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reject this booking? Please provide a reason.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Booking ID: <strong>{bookingId}</strong>
          </p>
          {equipmentName && (
            <p className="text-sm text-muted-foreground">
              Equipment: <strong>{equipmentName}</strong>
            </p>
          )}
          {userName && (
            <p className="text-sm text-muted-foreground">
              User: <strong>{userName}</strong>
            </p>
          )}
          <div>
            <Label htmlFor="rejection-reason">Reason for Rejection</Label>
            <Textarea
              id="rejection-reason"
              placeholder="e.g., Equipment unavailable, conflicting booking, invalid request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? 'Rejecting...' : 'Reject Booking'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
