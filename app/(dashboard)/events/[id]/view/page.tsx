import { getEventById } from "@/lib/actions/event";
import { getEventParticipants } from "@/lib/actions/event-participation";
import { notFound } from "next/navigation";
import { ParticipantsDataTable } from "./_components/ParticipantsDataTable";
import { EventDetails } from "./_components/EventDetails";

export default async function EventViewPage({
  params,
}: {
  params: { id: string };
}) {
  const event = await getEventById(params.id);
  const participants = await getEventParticipants(params.id);

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <EventDetails event={event} />
      <ParticipantsDataTable data={participants} />
    </div>
  );
}