
import { prisma } from "@/lib/prisma";
import { unstable_cache as cache } from "next/cache";
import { Event } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { EventFormValues } from "@/app/(dashboard)/events/_components/EventForm"; // Assuming this type will be defined

/**
 * Fetches all events from the database.
 * Includes participant counts.
 * Caches the result for 1 hour.
 */
export const getEvents = cache(
  async () => {
    const events = await prisma.event.findMany({
      orderBy: {
        startDate: "desc",
      },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });
    return events;
  },
  ["events_with_counts"],
  { revalidate: 3600 } // Revalidate every hour
);

/**
 * Fetches an event by its ID.
 * Includes participant details.
 * Caches the result for 1 hour.
 */
export const getEventById = cache(
  async (id: string) => {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: true, // Include user details for each participant
          },
        },
        createdBy: true, // Include creator details
      },
    });
    return event;
  },
  ["event_by_id"],
  { revalidate: 3600 }
);

/**
 * Creates a new event.
 */
export async function createEvent(data: EventFormValues) {
  "use server";
  try {
    const event = await prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        venue: data.venue,
        maxParticipants: data.maxParticipants,
        imageUrl: data.imageUrl,
        createdById: data.createdById, // Assuming createdById is part of EventFormValues
      },
    });
    revalidatePath("/events"); // Revalidate the path where events are displayed
    return { success: true, event };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, message: "Failed to create event." };
  }
}

/**
 * Updates an existing event.
 */
export async function updateEvent(id: string, data: EventFormValues) {
  "use server";
  try {
    const event = await prisma.event.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        venue: data.venue,
        maxParticipants: data.maxParticipants,
        imageUrl: data.imageUrl,
        // createdById is not updated here as it's the creator
      },
    });
    revalidatePath("/events"); // Revalidate the path where events are displayed
    revalidatePath(`/events/${id}`); // Revalidate the specific event page
    return { success: true, event };
  } catch (error) {
    console.error("Error updating event:", error);
    return { success: false, message: "Failed to update event." };
  }
}

/**
 * Deletes an event by its ID.
 */
export async function deleteEvent(id: string) {
  "use server";
  try {
    await prisma.event.delete({
      where: { id },
    });
    revalidatePath("/events"); // Revalidate the path where events are displayed
    return { success: true, message: "Event deleted successfully." };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, message: "Failed to delete event." };
  }
}

/**
 * Calculates the number of events per month.
 * Caches the result for 1 hour.
 */
export const getMonthlyEventCounts = cache(
  async () => {
    const events = await getEvents();
    const monthlyCounts: { [key: string]: { name: string; total: number } } = {};

    events.forEach((event) => {
      const month = new Date(event.createdAt).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (!monthlyCounts[month]) {
        monthlyCounts[month] = { name: month, total: 0 };
      }
      monthlyCounts[month].total += 1;
    });

    return Object.values(monthlyCounts);
  },
  ["monthly_event_counts"],
  { revalidate: 3600 }
);
