
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEventById } from "@/lib/actions/event";
import Image from "next/image";

type EventDetailsProps = {
  event: NonNullable<Awaited<ReturnType<typeof getEventById>>>;
};

export function EventDetails({ event }: EventDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{event.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {event.imageUrl && (
          <div className="relative h-64 w-full">
            <Image
              src={event.imageUrl}
              alt={event.name}
              layout="fill"
              objectFit="cover"
              className="rounded-md"
            />
          </div>
        )}
        <div>
          <h3 className="font-semibold">Description</h3>
          <p>{event.description}</p>
        </div>
        <div>
          <h3 className="font-semibold">Date and Time</h3>
          <p>
            {new Date(event.startDate).toLocaleString()} -{" "}
            {new Date(event.endDate).toLocaleString()}
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Venue</h3>
          <p>{event.venue}</p>
        </div>
        <div>
          <h3 className="font-semibold">Participants</h3>
          <p>
            {event.participants.length} / {event.maxParticipants}
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Created By</h3>
          <p>{event.createdBy?.name}</p>
        </div>
      </CardContent>
    </Card>
  );
}
