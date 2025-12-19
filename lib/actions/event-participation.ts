"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache as cache, revalidatePath } from "next/cache";

/**
 * Registers a user for an event.
 */
export async function registerForEvent(eventId: string, userId: string) {
  try {
    const existingParticipation = await prisma.eventParticipation.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existingParticipation) {
      return { success: false, message: "User already registered for this event." };
    }

    await prisma.eventParticipation.create({
      data: {
        eventId,
        userId,
      },
    });
    revalidatePath(`/events/${eventId}`); // Revalidate the event details page
    return { success: true, message: "Successfully registered for the event." };
  } catch (error) {
    console.error("Error registering for event:", error);
    return { success: false, message: "Failed to register for the event." };
  }
}

/**
 * Fetches all participants for a given event.
 * Caches the result for 1 hour.
 */
export const getEventParticipants = cache(
  async (eventId: string) => {
    const participants = await prisma.eventParticipation.findMany({
      where: { eventId },
      include: {
        user: true, // Include user details of the participant
      },
    });
    return participants;
  },
  ["event_participants"],
  { revalidate: 3600 }
);

/**
 * Checks if a user is registered for an event.
 */
export async function isUserRegisteredForEvent(eventId: string, userId: string) {
  "use server";
  try {
    const participation = await prisma.eventParticipation.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });
    return !!participation;
  } catch (error) {
    console.error("Error checking event registration:", error);
    return false;
  }
}
