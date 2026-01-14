import { getEventById } from "@/lib/actions/event";
import { getEventParticipants } from "@/lib/actions/event-participation";
import { notFound } from "next/navigation";
import { EventDetails } from "./_components/EventDetails";
import { ParticipantsDataTable } from "./_components/ParticipantsDataTable";

export default async function EventViewPage({
  params,
}: {
  params: { id: string };
}) {
  const res = await params;
  const event = await getEventById(res.id);
  const participants = await getEventParticipants(res.id);

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