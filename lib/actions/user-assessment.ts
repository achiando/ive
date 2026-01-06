"use server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function hasUserTakenAnyAssessment(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (!session) {
    // If no session, user is not logged in, so they haven't taken an assessment
    return false;
  }

  const userId = session.user.id;

  try {
    const attemptCount = await prisma.safetyTestAttempt.count({
      where: {
        userId: userId,
      },
    });
    return attemptCount > 0;
  } catch (error) {
    console.error("Error checking user assessment attempts:", error);
    // In case of an error, assume they haven't taken one to prompt them
    return false;
  }
}

export async function getRandomAssessmentDetails(): Promise<{
  safetyTestId?: string;
  manualUrl?: string | null;
  documentTitle: string;
}> {
  try {
    const safetyTestCount = await prisma.safetyTest.count();
    if (safetyTestCount === 0) {
      console.warn("⚠️ No safety tests found in the database. Please seed the database.");
      // Return a generic assessment title, the frontend will show a modal but the AI will have nothing to generate from.
      return { documentTitle: "No Safety Assessments Available" };
    }

    const skip = Math.floor(Math.random() * safetyTestCount);
    const randomSafetyTest = await prisma.safetyTest.findFirst({
      skip: skip,
      select: {
        id: true,
        name: true,
        manualUrl: true,
      },
    });

    if (!randomSafetyTest) {
      // This should theoretically not happen if count > 0, but as a fallback.
      return { documentTitle: "Could Not Find Safety Assessment" };
    }

    return {
      safetyTestId: randomSafetyTest.id,
      manualUrl: randomSafetyTest.manualUrl,
      documentTitle: randomSafetyTest.name,
    };
  } catch (error) {
    console.error("Error getting random assessment details:", error);
    // Fallback in case of a database error
    return { documentTitle: "Error Retrieving Assessment" };
  }
}
