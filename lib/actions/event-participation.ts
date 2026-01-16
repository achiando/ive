"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache as cache, revalidatePath } from "next/cache";

/**
 * Registers a user for an event.
 */
export async function registerForEvent(
  eventId: string, 
  userId?: string, 
  guestEmail?: string, 
  guestName?: string
) {
  try {
    const orConditions = [];
    if (userId) {
      orConditions.push({ userId });
    }
    if (guestEmail) {
      orConditions.push({ guestEmail });
    }

    if (orConditions.length > 0) {
        const existingParticipation = await prisma.eventParticipation.findFirst({
          where: {
            eventId,
            OR: orConditions,
          },
        });

        if (existingParticipation) {
          const message = existingParticipation.userId 
            ? "You are already registered for this event."
            : "This email is already registered for this event.";
          return { success: false, message };
        }
    }

    await prisma.eventParticipation.create({
      data: {
        eventId,
        ...(userId && { userId }),
        ...(guestEmail && { guestEmail }),
        ...(guestName && { guestName })
      },
    });
    
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/register`);
    return { success: true, message: "Successfully registered for the event!" };
  } catch (error) {
    console.error("Error registering for event:", error);
    return { success: false, message: "Failed to register for the event. Please try again." };
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
export async function isRegisteredForEvent(
  eventId: string, 
  userId?: string, 
  guestEmail?: string
) {
  "use server";
  try {
    const orConditions = [];
    if (userId) {
      orConditions.push({ userId });
    }
    if (guestEmail) {
      orConditions.push({ guestEmail });
    }

    if (orConditions.length === 0) {
      return { isRegistered: false, asGuest: false };
    }

    const participation = await prisma.eventParticipation.findFirst({
      where: {
        eventId,
        OR: orConditions,
      },
    });
    
    return {
      isRegistered: !!participation,
      asGuest: !!(participation?.guestEmail && guestEmail && participation.guestEmail === guestEmail)
    };
  } catch (error) {
    console.error("Error checking event registration:", error);
    return { isRegistered: false, asGuest: false };
  }
}