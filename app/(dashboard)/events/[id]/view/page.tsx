
import { createEvent, getEventById, updateEvent } from "@/lib/actions/event";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { EventForm, EventFormValues } from "../../_components/EventForm";


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

  // In your EventPage component, before passing data to EventForm
const sanitizedEventData = eventData ? {
  ...eventData,
  description: eventData.description ?? undefined,
  // Add any other fields that might be null
} : undefined;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        {isNewEvent ? "Create New Event" : "Edit Event"}
      </h1>
      <EventForm 
    initialData={sanitizedEventData} 
    onSubmit={handleSubmit} 
    createdById={createdById} 
  />
    </div>
  );
}
