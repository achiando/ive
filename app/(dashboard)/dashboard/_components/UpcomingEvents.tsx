import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCard, EventWithVenue } from "@/app/(dashboard)/events/_components/EventCard";

interface UpcomingEventsProps {
  events: EventWithVenue[];
  isLoading: boolean;
}

export function UpcomingEvents({ events, isLoading }: UpcomingEventsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.length > 0 ? (
          events.map((event) => (
            <EventCard key={event.id} event={event} variant="compact" showActions={false} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming events.</p>
        )}
      </CardContent>
    </Card>
  );
}
