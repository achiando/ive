"use client";

import { useState } from 'react';
import { ProjectWithDetails } from '@/types/project';
import { UserRole, ProjectStatus } from '@prisma/client';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { format, isFuture } from 'date-fns';
import { Calendar, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { BookingDialog } from '@/components/booking/BookingDialog'; // Not yet implemented
// import { StatusBadge } from './StatusBadge'; // Not yet implemented
import { ProjectActions } from './cell-action'; // Re-using cell-action for dropdown
import { useSession } from 'next-auth/react';

interface ProjectCardProps {
  project: ProjectWithDetails;
  userRole: UserRole;
  onAction: (action: string, project: ProjectWithDetails) => void;
  onClick?: () => void;
  className?: string;
}

// Placeholder for StatusBadge - will be implemented later if needed
const StatusBadge = ({ status }: { status: ProjectStatus }) => {
  const getStatusVariant = (status: ProjectStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'default';
      case 'PENDING_APPROVAL':
        return 'secondary';
      case 'REJECTED':
      case 'CANCELLED':
        return 'destructive';
      case 'IN_PROGRESS':
        return 'outline';
      case 'COMPLETED':
        return 'success'; // Assuming a 'success' variant exists or can be added
      case 'ON_HOLD':
        return 'warning'; // Assuming a 'warning' variant exists or can be added
      case 'DRAFT':
      default:
        return 'outline';
    }
  };

  const formatStatus = (status: ProjectStatus) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  };

  return (
    <Badge variant={getStatusVariant(status)}>
      {formatStatus(status)}
    </Badge>
  );
};


export function ProjectCard({ 
  project, 
  userRole, 
  onAction, 
  onClick,
  className = '' 
}: ProjectCardProps) {
  const { data: session } = useSession();
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const membersCount = project.members?.length || 0;
  
  const handleBookingSuccess = () => {
    // Refresh project data to show new booking
    onAction('refresh', project);
  };
  
  // Parse date to handle both string and Date objects
  const parseDate = (date: string | Date | null | undefined): Date | null => {
    if (!date) return null;
    return date instanceof Date ? date : new Date(date);
  };

  // Format date for display
  const formatDate = (date: string | Date | null | undefined, formatStr: string): string => {
    const parsedDate = parseDate(date);
    return parsedDate ? format(parsedDate, formatStr) : 'N/A';
  };

  // Placeholder for upcoming bookings - ProjectWithDetails does not include bookings directly yet
  // const upcomingBookings = (project.bookings || []).filter(booking => {
  //   const endDate = parseDate(booking.endDate);
  //   return endDate ? isFuture(endDate) : false;
  // }).sort((a, b) => {
  //   const aDate = parseDate(a.startDate);
  //   const bDate = parseDate(b.startDate);
  //   return (aDate?.getTime() || 0) - (bDate?.getTime() || 0);
  // });
  
  const canBook = [
    UserRole.ADMIN, 
    UserRole.LAB_MANAGER, 
    UserRole.STUDENT
  ].includes(userRole);
  
  return (
    <Card 
      className={`overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer ${className}`} 
      onClick={onClick}
    >
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
            <div className="flex items-center space-x-2 mb-2">
            <StatusBadge status={project.status as ProjectStatus} />
              <span className="text-sm text-muted-foreground">
                {membersCount} {membersCount === 1 ? 'member' : 'members'}
              </span>
            </div>
          </div>
          <ProjectActions 
            data={project} // Use 'data' prop for CellAction
            // userRole={userRole} // CellAction gets userRole from session
            // onAction={onAction} // CellAction handles its own actions
            // variant="ghost" 
            // size="sm"
            // onClick={(e) => e.stopPropagation()}
          />
        </div>
        
        <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-1">
          {project.description || 'No description provided'}
        </p>
        
        {/* Upcoming Bookings Section - Placeholder for now */}
        {/* {upcomingBookings.length > 0 && (
          <div className="mt-3 space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1.5" />
              Upcoming Bookings
            </h4>
            <div className="space-y-1.5">
              {upcomingBookings.slice(0, 2).map((booking) => (
                <div key={booking.id} className="flex items-center text-xs bg-muted/50 rounded px-2 py-1">
                  <Calendar className="h-3 w-3 mr-1.5 text-muted-foreground" />
                  <span>
                    {formatDate(booking.startDate, 'MMM d')} • {formatDate(booking.startDate, 'h:mm a')} - {formatDate(booking.endDate, 'h:mm a')}
                  </span>
                </div>
              ))}
              {upcomingBookings.length > 2 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{upcomingBookings.length - 2} more
                </div>
              )}
            </div>
          </div>
        )} */}
        
        <div className="mt-4 pt-2 border-t text-xs text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>Created {format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
            {project.updatedAt !== project.createdAt && (
              <span className="text-xs text-muted-foreground">
                Updated {format(new Date(project.updatedAt), 'MMM d, yyyy')}
              </span>
            )}
          </div>
          
          {project.startDate && (
            <div className="mt-1">
              <span className="font-medium">Timeline: </span>
              <span>
                {format(new Date(project.startDate), 'MMM d')} - {project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : 'Ongoing'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      
      {canBook && (
        <CardFooter className="p-4 pt-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              setIsBookingDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Book Equipment
          </Button>
        </CardFooter>
      )}
      
      {/* BookingDialog - Not yet implemented */}
      {/* <BookingDialog
        isOpen={isBookingDialogOpen}
        onOpenChange={setIsBookingDialogOpen}
        equipmentId={''}
        equipmentName={''}
        project={{ id: project.id, title: project.title }}
        onSuccess={handleBookingSuccess}
      /> */}
    </Card>
  );
}
