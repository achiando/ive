import { useState, useEffect } from "react";

// Types matching the EventsCarousel interface
export type TagColor = "red" | "green";

export interface EventDate {
  label: string;
  value: string;
}

export interface EventCTA {
  label: string;
  href: string;
}

export interface Event {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  body: string;
  dates: EventDate[];
  cta: EventCTA;
  contact: string;
  poster: string | null;
  tagColor: TagColor;
}

export interface UseUpcomingEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Transform database events to match the EventsCarousel interface
function transformEventData(events: any[]): Event[] {
  return events.map((event, index) => ({
    id: index + 1,
    tag: event.tag || "Event",
    title: event.name,
    subtitle: event.subtitle || "",
    body: event.description || event.body || "",
    dates: event.dates || [
      { label: "Start Date", value: new Date(event.startDate).toLocaleDateString() },
      ...(event.endDate ? [{ label: "End Date", value: new Date(event.endDate).toLocaleDateString() }] : [])
    ],
    cta: event.cta || { label: "Learn More", href: "#" },
    contact: event.contact || "",
    poster: event.imageUrl || event.poster || null,
    tagColor: (event.tagColor === "red" ? "red" : "green") as "red" | "green",
  }));
}

export function useUpcomingEvents(): UseUpcomingEventsReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/events/upcoming");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }
      
      const data = await response.json();
      const transformedEvents = transformEventData(data.events || []);
      setEvents(transformedEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching upcoming events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  };
}
