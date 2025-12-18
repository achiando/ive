
import { Button } from "@/components/ui/button";
import { getEventById } from "@/lib/actions/event";
import { isUserRegisteredForEvent } from "@/lib/actions/event-participation";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { EventRegistrationForm } from "./_components/EventRegistrationForm";

export default async function EventRegisterPage({
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

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  let isRegistered = false;

  if (userId) {
    isRegistered = await isUserRegisteredForEvent(id, userId);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <EventRegistrationForm event={eventData} isRegistered={isRegistered} />
    </div>
  );
}
