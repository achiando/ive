
import { getEventById, createEvent, updateEvent } from "@/lib/actions/event";
import { redirect } from "next/navigation";
import { EventForm, EventFormValues } from "../_components/EventForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface EventPageProps {
  params: {
    id: string;
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = params;

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
      <EventForm initialData={eventData || undefined} onSubmit={handleSubmit} createdById={createdById} />
    </div>
  );
}
