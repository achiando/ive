"use client";

import { format } from 'date-fns';
import { Calendar, Clock, User, Wrench, AlertCircle, CheckCircle, XCircle, Clock as ClockIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { BookingDetails, BookingStatus } from '@/types/booking'; // Updated import
import { updateBookingStatus } from '@/lib/actions/booking'; // Import updateBookingStatus action
import { RejectBookingDialog } from './RejectBookingDialog'; // Assuming this component will be created

type BookingAction = 'edit' | 'cancel' | 'approve' | 'reject';

interface BookingCardProps {
  booking: BookingDetails; // Use BookingDetails type
  className?: string;
  isUpdating?: boolean;
}

export function BookingCard({ 
  booking, 
  className, 
  isUpdating: externalIsUpdating = false 
}: BookingCardProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(externalIsUpdating);
  const [error, setError] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isManagerOrAdmin = userRole === 'LAB_MANAGER' || userRole === 'ADMIN';
  const isTechnician = userRole === 'TECHNICIAN' || userRole === 'ADMIN_TECHNICIAN';

  // Show approve button only for pending bookings (legacy bookings that weren't auto-approved)
  // New bookings are auto-approved, but some old pending bookings might still exist
  const shouldShowApproveButton = booking.status === BookingStatus.PENDING;

  const handleAction = async (action: BookingAction, bookingId: string) => {
    try {
      setIsUpdating(true);
      setError(null);

      if (action === 'edit') {
        router.push(`/dashboard/bookings/${bookingId}`);
        return;
      }

      if (action === 'reject') {
        setIsUpdating(false);
        setShowRejectDialog(true);
        return;
      }

      let newStatus: BookingStatus | undefined;
      if (action === 'approve') newStatus = BookingStatus.APPROVED;
      if (action === 'cancel') newStatus = BookingStatus.CANCELLED;

      if (!newStatus) {
        throw new Error(`Invalid action: ${action}`);
      }

      const result = await updateBookingStatus(bookingId, newStatus);

      if (result.success) {
        toast.success(`Booking ${newStatus.toLowerCase()} successfully`);
        router.refresh(); // Refresh the page to show updated status
      } else {
        toast.error(result.message || `Failed to update booking status.`);
      }

    } catch (error: any) {
      console.error(`Error ${action}ing booking:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      toast.error(`Failed to ${action} booking: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    try {
      setIsUpdating(true);
      setError(null);

      const result = await updateBookingStatus(booking.id, BookingStatus.REJECTED, reason);

      if (result.success) {
        toast.success("Booking rejected successfully.");
        router.refresh(); // Refresh the page to show updated status
      } else {
        toast.error(result.message || "Failed to reject booking.");
      }
    } catch (error: any) {
      console.error('Error rejecting booking:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error; // Re-throw to let the dialog handle the error
    } finally {
      setIsUpdating(false);
      setShowRejectDialog(false);
    }
  };

  const startDate = booking.startDate;
  const endDate = booking.endDate;
  const isPast = booking.isPast; // Use the derived property

  const statusVariants = {
    [BookingStatus.PENDING]: { label: 'Pending', variant: 'outline', icon: ClockIcon },
    [BookingStatus.APPROVED]: { label: 'Approved', variant: 'default', icon: CheckCircle },
    [BookingStatus.REJECTED]: { label: 'Rejected', variant: 'destructive', icon: XCircle },
    [BookingStatus.CANCELLED]: { label: 'Cancelled', variant: 'secondary', icon: XCircle },
    [BookingStatus.COMPLETED]: { label: 'Completed', variant: 'default', icon: CheckCircle },
    [BookingStatus.IN_PROGRESS]: { label: 'In Progress', variant: 'default', icon: ClockIcon },
    [BookingStatus.CHECKED_OUT]: { label: 'Checked Out', variant: 'default', icon: CheckCircle },
    [BookingStatus.RETURNED]: { label: 'Returned', variant: 'default', icon: CheckCircle },
    [BookingStatus.OVERDUE]: { label: 'Overdue', variant: 'destructive', icon: AlertCircle },
  } as const;

  const statusConfig = statusVariants[booking.status] || statusVariants[BookingStatus.PENDING];
  const StatusIcon = statusConfig.icon;

  return (
    <>
    <Card className={cn('w-full overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.purpose || 'Untitled Booking'}</CardTitle>
            <CardDescription className="mt-1">
              {booking.equipment?.name || 'No Equipment'}
            </CardDescription>
          </div>
          <Badge 
            variant={statusConfig.variant as any} 
            className={cn("flex items-center gap-1", {
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400': booking.status === BookingStatus.PENDING,
            })}
          >
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <div>
              <p>{format(startDate, 'MMMM dd, yyyy')}</p>
              <p className="text-muted-foreground">
                {`${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`}
              </p>
            </div>
          </div>
          
          {booking.project && (
            <div className="flex items-center text-sm">
              <Wrench className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{booking.project.title || 'Project'}</span>
            </div>
          )}
          
          {booking.user?.name && (
            <div className="flex items-center text-sm">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{booking.user.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    
        <CardFooter className="flex justify-end gap-2 pt-2">
          {(isManagerOrAdmin || isTechnician) ? (
            // Manager/Admin/Technician view - show all actions
            <>
              {shouldShowApproveButton && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAction('approve', booking.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Approving...' : 'Approve'}
                </Button>
              )}
              {booking.status !== BookingStatus.REJECTED && booking.status !== BookingStatus.CANCELLED && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAction('reject', booking.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Rejecting...' : 'Reject'}
                </Button>
              )}
              {!isPast && booking.status !== BookingStatus.CANCELLED && booking.status !== BookingStatus.REJECTED && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAction('cancel', booking.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Cancelling...' : 'Cancel'}
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAction('edit', booking.id)}
                disabled={isUpdating}
              >
                {isUpdating ? 'Loading...' : 'View'}
              </Button>
            </>
          ) : (
            // Regular user view - only show View/Cancel button
            <>
              {!isPast && booking.status !== BookingStatus.CANCELLED && booking.status !== BookingStatus.REJECTED && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAction('cancel', booking.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Cancelling...' : 'Cancel'}
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAction('edit', booking.id)}
                disabled={isUpdating}
              >
                {isUpdating ? 'Loading...' : 'View'}
              </Button>
            </>
          )}
          {error && (
            <p className="text-xs text-red-500 mt-2">{error}</p>
          )}
        </CardFooter>
    </Card>
    
    <RejectBookingDialog
      isOpen={showRejectDialog}
      onClose={() => setShowRejectDialog(false)}
      onConfirm={handleRejectConfirm}
      bookingId={booking.id}
      equipmentName={booking.equipment?.name}
      userName={booking.user?.name || undefined}
      isLoading={isUpdating}
    />
    </>
  );
}
