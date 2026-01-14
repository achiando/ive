import { Button } from "@/components/ui/button";
import { getEventById } from "@/lib/actions/event";
import { isRegisteredForEvent } from "@/lib/actions/event-participation";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { EventRegistrationForm } from "./_components/EventRegistrationForm";

export default async function EventRegisterPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const res = await params;
  const id = res.id;
  const asGuest = searchParams?.asGuest === 'true';

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
  let isGuest = false;

  if (userId) {
    const registration = await isRegisteredForEvent(id, userId);
    isRegistered = registration.isRegistered;
    isGuest = registration.asGuest;
  } else if (asGuest) {
    // For guests, we'll check registration status in the client component
    // since we don't have their email in the server component
    isRegistered = false;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <EventRegistrationForm 
        event={eventData} 
        isRegistered={isRegistered || isGuest} 
        asGuest={asGuest}
      />
    </div>
  );
}
