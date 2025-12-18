
'use client';

import { UserRole } from '@prisma/client';
import { format } from 'date-fns';
import { Calendar, Edit, MapPin, MoreVertical, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSession } from '@/hooks/useSession'; // Custom useSession hook
// import { deleteEvent } from '@/lib/actions/event'; // Server action for deleting event - REMOVED

export type EventWithVenue = {
  id: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  location: string | null;
  createdById: string;
  venue?: string | null;
  maxParticipants: number | null;
  imageUrl?: string | null;
  imageId?: string | null; // Assuming imageId might be used for image management
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    participants: number;
  };
};

interface EventCardProps {
  event: EventWithVenue;
  showActions?: boolean;
  showViewDetailsButton?: boolean;
  className?: string;
  variant?: 'default' | 'compact';
  onEdit?: (event: EventWithVenue) => void;
  onDelete?: (eventId: string) => Promise<void>; // Modified to accept a Promise<void>
}

export function EventCard({ 
  event, 
  showActions = true, 
  className = '',
  showViewDetailsButton = false,
  variant = 'default',
  onEdit,
  onDelete
}: EventCardProps) {
  const router = useRouter();
  const { user, loading, hasAnyRole } = useSession(); // Use custom useSession hook
  
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Check permissions using hasAnyRole
  const canEdit = hasAnyRole([UserRole.ADMIN, UserRole.LAB_MANAGER]);
  const canDelete = hasAnyRole([UserRole.ADMIN, UserRole.LAB_MANAGER]);
  
  // Show action buttons if user has permissions and actions are enabled
  const showActionButtons = showActions && (canEdit || canDelete);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    if (onDelete) {
      setIsDeleting(true);
      await onDelete(event.id); // Call the prop function
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(event);
    } else {
      router.push(`/events/${event.id}`); // Assuming edit route is /events/[id]
    }
  };
  
  const eventDate = new Date(event.startDate);
  const formattedDate = format(eventDate, 'MMM d, yyyy');
  const formattedTime = format(eventDate, 'h:mm a');

  if (loading) {
    return <div>Loading event card...</div>;
  }

  if (variant === 'compact') {
    return (
      <Card className={`hover:shadow-lg transition-shadow flex flex-row ${className}`}>
        {event.imageUrl && (
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src={event.imageUrl}
              alt={event.name}
              fill
              className="object-cover rounded-l-lg"
            />
          </div>
        )}
        <div className="flex flex-col flex-1 p-4">
          <CardTitle className="text-lg font-semibold line-clamp-1">
            {event.name}
          </CardTitle>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{formattedDate} • {formattedTime}</span>
          </div>
          {event.venue && (
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="line-clamp-1">{event.venue}</span>
            </div>
          )}
          {showViewDetailsButton && showActions && (
            <div className="mt-3 flex justify-end">
              <Button size="sm" asChild>
                <Link href={`/events/${event.id}/view`}>View Details</Link>
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow overflow-hidden ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl">{event.name}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4" /> {/* Replaced Icons.calendar */}
          {event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }) : 'Date TBD'}
          <span className="mx-2">•</span>
          {event.startDate ? new Date(event.startDate).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }) : '--:--'}
          {event.endDate && (
            <>
              <span className="mx-1">-</span>
              {event.endDate ? new Date(event.endDate).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              }) : '--:--'}
            </>
          )}
        </div>
        {event.venue && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" /> {/* Replaced Icons.mapPin */}
            {event.venue}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 line-clamp-3">
          {event.description || 'No description available.'}
        </p>
        <div className="flex justify-between items-center mt-4">
          <div className="flex-1">
            {event.maxParticipants && (
              <span className="text-sm text-muted-foreground">
                {(event._count?.participants || 0)} / {event.maxParticipants} participants
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/events/${event.id}/view`}>
                View Details
              </Link>
            </Button>
            
            {showActionButtons && ( // Use showActionButtons here
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">More actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Calendar className="mr-2 h-4 w-4 animate-spin" /> // Using Calendar as a spinner placeholder
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      <span>Delete</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
