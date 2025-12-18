"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache as cache } from "next/cache";

/**
 * Fetches all equipment from the database.
 * Caches the result for 1 hour.
 */
export const getEquipment = cache(
  async () => {
    const equipment = await prisma.equipment.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        bookings: true,
      },
    });
    return equipment;
  },
  ["all_equipment"],
  { revalidate: 3600 } // Revalidate every hour
);
