"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Grid2X2, List } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";
import { columns } from "./columns";
import { EventAnalytics } from "./EventAnalytics";
import { EventCard, EventWithVenue } from "./EventCard";
import { deleteEvent } from "@/lib/actions/event"; // Import the server action
import { toast } from "sonner";
import { useRouter } from "next/navigation";


interface EventsPageClientComponentProps {
  initialEvents: EventWithVenue[];
}

export function EventsPageClientComponent({ initialEvents }: EventsPageClientComponentProps) {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const router = useRouter();

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    const result = await deleteEvent(eventId);
    if (result.success) {
      toast.success("Event deleted successfully.");
      router.refresh(); // Refresh the page to show updated event list
    } else {
      toast.error(result.message || "Failed to delete event.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Events
        </h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? 'bg-gray-100' : ''}
          >
            <List className="h-4 w-4 mr-2" /> Table View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-gray-100' : ''}
          >
            <Grid2X2 className="h-4 w-4 mr-2" /> Grid View
          </Button>
          <Button asChild>
            <Link href="/events/new">New Event</Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <EventAnalytics events={initialEvents} isLoading={!initialEvents} />
      </Suspense>

      {viewMode === 'table' ? (
        <DataTable 
          columns={columns} 
          data={initialEvents}
          filterColumnId="name"
          filterColumnPlaceholder="Filter by event name..."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialEvents.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              showViewDetailsButton={true} 
              onDelete={handleDeleteEvent} // Pass the handler
            />
          ))}
        </div>
      )}
    </div>
  );
}
