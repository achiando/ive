
import { getEvents } from "@/lib/actions/event";
import { EventsPageClientComponent } from "./_components/EventsPageClientComponent";
import { EventWithVenue } from "./_components/EventCard"; // Import EventWithVenue

export default async function EventsPage() {
  const events: EventWithVenue[] = await getEvents();

  return <EventsPageClientComponent initialEvents={events} />;
}


