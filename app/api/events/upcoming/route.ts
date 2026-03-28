import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to get current date without time for comparisons
const getToday = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

export async function GET() {
  try {
    const today = getToday();

    const events = await prisma.event.findMany({
      where: {
        OR: [
          { startDate: { gte: today } }, // future events
          {
            startDate: { lte: today },
            endDate: { gte: today }, // currently ongoing
          },
        ],
      },
      orderBy: { startDate: "asc" },
      take: 20,
      include: {
        _count: { select: { participants: true } },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
    });
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch upcoming events",
        events: [],
      },
      { status: 500 }
    );
  }
}
