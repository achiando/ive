import { getEvents } from "@/lib/actions/event";
import { getEventParticipants } from "@/lib/actions/event-participation";
import { EventsPageClientComponent } from "./_components/EventsPageClientComponent";
import { EventWithVenue } from "./_components/EventCard"; // Import EventWithVenue

export default async function EventsPage() {
  const eventsData = await getEvents();

  // Manually fetch participant counts to ensure data is fresh
  const eventsWithCounts = await Promise.all(
    eventsData.map(async (event) => {
      const participants = await getEventParticipants(event.id);
      return {
        ...event,
        _count: {
          participants: participants.length,
        },
      };
    })
  );

  const events: EventWithVenue[] = eventsWithCounts;

  return <EventsPageClientComponent initialEvents={events} />;
}