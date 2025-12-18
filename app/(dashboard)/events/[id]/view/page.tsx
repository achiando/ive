
import { Button } from "@/components/ui/button";
import { getEventById } from "@/lib/actions/event";
import Link from "next/link";
import { EventView, EventWithParticipants } from "./_components/EventView";

export default async function EventViewPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  if (!id) {
    return (
      <div className="text-center">
        <p className="text-lg font-semibold">Invalid event ID</p>
        <Button asChild variant="link">
          <Link href="/events">Go back to all events</Link>
        </Button>
      </div>
    );
  }

  try {
    const eventData = await getEventById(id);

    if (!eventData) {
      return (
        <div className="text-center">
          <p className="text-lg font-semibold">Event not found</p>
          <Button asChild variant="link">
            <Link href="/events">Go back to all events</Link>
          </Button>
        </div>
      );
    }

    return <EventView event={eventData as EventWithParticipants} />;
  } catch (error) {
    console.error('Error fetching event:', error);
    return (
      <div className="text-center">
        <p className="text-lg font-semibold">Error loading event</p>
        <Button asChild variant="link">
          <Link href="/events">Go back to all events</Link>
        </Button>
      </div>
    );
  }
}
