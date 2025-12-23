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
  equipmentId?: string;
  manualUrl?: string | null;
  documentTitle: string;
}> {
  try {
    // Get a random SafetyTest
    const safetyTestCount = await prisma.safetyTest.count();
    let randomSafetyTest = null;
    if (safetyTestCount > 0) {
      const skipSafetyTest = Math.floor(Math.random() * safetyTestCount);
      randomSafetyTest = (await prisma.safetyTest.findMany({
        take: 1,
        skip: skipSafetyTest,
      }))[0];
    }

    // Get a random Equipment
    const equipmentCount = await prisma.equipment.count();
    let randomEquipment = null;
    if (equipmentCount > 0) {
      const skipEquipment = Math.floor(Math.random() * equipmentCount);
      randomEquipment = (await prisma.equipment.findMany({
        take: 1,
        skip: skipEquipment,
      }))[0];
    }

    let safetyTestId: string | undefined = undefined;
    let equipmentId: string | undefined = undefined;
    let manualUrl: string | null | undefined = null;
    let documentTitle: string = "General Safety Assessment";

    // Prioritize SafetyTest if available
    if (randomSafetyTest) {
      safetyTestId = randomSafetyTest.id;
      documentTitle = randomSafetyTest.name;
      manualUrl = randomSafetyTest.manualUrl;

      // If SafetyTest has an associated equipment type, try to find a matching equipment
      if (randomSafetyTest.associatedEquipmentType) {
        const matchingEquipment = await prisma.equipment.findFirst({
          where: {
            category: {
              contains: randomSafetyTest.associatedEquipmentType, // Assuming category can match associatedEquipmentType
              mode: 'insensitive'
            }
          }
        });
        if (matchingEquipment) {
          equipmentId = matchingEquipment.id;
          // Prioritize equipment's manual if safety test didn't have one
          if (!manualUrl && matchingEquipment.manualUrl) {
            manualUrl = matchingEquipment.manualUrl;
          }
        }
      }
    }

    // If no SafetyTest or no matching equipment, use a random equipment
    if (!safetyTestId && randomEquipment) {
      equipmentId = randomEquipment.id;
      documentTitle = randomEquipment.name;
      manualUrl = randomEquipment.manualUrl;
    } else if (safetyTestId && !equipmentId && randomEquipment) {
        // If we have a safety test but no matching equipment, and we have a random equipment,
        // we can still associate it if it makes sense, or just stick with the safety test.
        // For now, let's stick with the safety test's context if equipment wasn't explicitly matched.
        // If we want to force an equipment, we could assign randomEquipment.id here.
    }


    // Fallback if nothing specific was found
    if (!safetyTestId && !equipmentId) {
        // If both are still undefined, and we have a random equipment, use it
        if (randomEquipment) {
            equipmentId = randomEquipment.id;
            documentTitle = randomEquipment.name;
            manualUrl = randomEquipment.manualUrl;
        } else if (randomSafetyTest) {
            // If only randomSafetyTest was found but no equipment, use it
            safetyTestId = randomSafetyTest.id;
            documentTitle = randomSafetyTest.name;
            manualUrl = randomSafetyTest.manualUrl;
        } else {
            // If absolutely nothing is found, provide a generic assessment
            documentTitle = "General Safety Assessment";
        }
    }


    return {
      safetyTestId,
      equipmentId,
      manualUrl,
      documentTitle,
    };
  } catch (error) {
    console.error("Error getting random assessment details:", error);
    return { documentTitle: "General Safety Assessment" }; // Fallback
  }
}
