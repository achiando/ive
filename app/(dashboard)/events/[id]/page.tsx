
import { createEvent, getEventById, updateEvent } from "@/lib/actions/event";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { EventForm, EventFormValues } from "../_components/EventForm";

interface EventPageProps {
  params: {
    id: string;
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  const createdById = session?.user?.id;

  if (!createdById) {
    redirect("/api/auth/signin"); // Redirect to login if user is not authenticated
  }

  const isNewEvent = id === 'new';
  const eventData = isNewEvent ? null : await getEventById(id);

  if (!isNewEvent && !eventData) {
    return <div>Event not found.</div>;
  }

  // Format event data for the form, ensuring dates are properly handled
  const formattedEventData = eventData ? {
    id: eventData.id,
    name: eventData.name,
    description: eventData.description || undefined,
    startDate: new Date(eventData.startDate).toISOString(),
    endDate: new Date(eventData.endDate).toISOString(),
    venue: eventData.venue || undefined,
    maxParticipants: eventData.maxParticipants || undefined,
    imageUrl: eventData.imageUrl || undefined,
    createdById: eventData.createdById,
  } : undefined;

  const handleSubmit = async (data: EventFormValues) => {
    "use server";
    
    if (isNewEvent) {
      await createEvent({ ...data, createdById: createdById });
    } else {
      if (eventData) {
        await updateEvent(eventData.id, data);
      }
    }
    redirect("/events");
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        {isNewEvent ? "Create New Event" : "Edit Event"}
      </h1>
      <EventForm initialData={formattedEventData} onSubmit={handleSubmit} createdById={createdById} />
    </div>
  );
}
