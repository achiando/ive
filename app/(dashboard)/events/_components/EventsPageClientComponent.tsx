"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteEvent } from "@/lib/actions/event"; // Import the server action
import { Grid2X2, List } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { columns } from "./columns";
import { EventAnalytics } from "./EventAnalytics";
import { EventCard, EventWithVenue } from "./EventCard";
import EventsCarousel from "@/components/UpcomingEvents";


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
     const { data: session } = useSession();
      const canAddEvent = [
        'TECHNICIAN',
        'ADMIN_TECHNICIAN',
        'LAB_MANAGER',
        'ADMIN'
      ].includes(session?.user?.role || '');

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
          {
            canAddEvent && (
              <Button asChild>
                <Link href="/events/new">New Event</Link>
              </Button>
            )
          }
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <EventAnalytics events={initialEvents} isLoading={!initialEvents} />
      </Suspense>
<section id="home" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Centre for Design, Innovation & Engineering
                <span className="block text-blue-600 dark:text-blue-400 mt-2">
                  CDIE Kenyatta University
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Cutting-edge innovation hub for medical device design, engineering, and prototyping. 
                Transform healthcare through technology and innovation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  href="/login" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
                >
                  Access System
                </Link>
                <Link 
                  href="https://cdie.co.ke" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-gray-300 hover:border-gray-400 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-lg font-semibold transition-all hover:bg-gray-100 dark:hover:bg-gray-800 text-lg"
                >
                  Visit CDIE.co.ke
                </Link>
              </div>
            </div>

            {/* Events Section */}
            <div className="mb-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Upcoming Medical Device Innovation Events
                </h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Join our workshops, design challenges, and programs focused on medical device prototyping and healthcare innovation.
                </p>
              </div>
              <EventsCarousel />
            </div>

            {/* Focus Areas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">Design</div>
                <div className="text-gray-600 dark:text-gray-300">Medical Device Design</div>
              </div>
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">Engineering</div>
                <div className="text-gray-600 dark:text-gray-300">Prototyping & Testing</div>
              </div>
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">Innovation</div>
                <div className="text-gray-600 dark:text-gray-300">Healthcare Solutions</div>
              </div>
            </div>
          </div>
        </section>
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
