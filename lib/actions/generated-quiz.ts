"use server";

import { prisma } from "@/lib/prisma";
import { QuizQA } from "@/types/assessment";

/**
 * Retrieves a random quiz from the database based on equipmentId or safetyTestId.
 * @param equipmentId - The ID of the equipment.
 * @param safetyTestId - The ID of the safety test.
 * @returns A random quiz or null if none are found.
 */
export async function getQuizFromDB(
  equipmentId: string | undefined,
  safetyTestId: string | undefined
): Promise<QuizQA[] | null> {
  if (!equipmentId && !safetyTestId) {
    return null;
  }

  try {
    const whereClause = {
      equipmentId: equipmentId || null,
      safetyTestId: safetyTestId || null,
    };

    const quizCount = await prisma.generatedQuiz.count({ where: whereClause });

    if (quizCount === 0) {
      return null;
    }

    const skip = Math.floor(Math.random() * quizCount);
    const randomQuiz = await prisma.generatedQuiz.findFirst({
      where: whereClause,
      skip: skip,
    });

    if (randomQuiz && Array.isArray(randomQuiz.questions)) {
      console.log(`✅ Found and returning a random cached quiz from DB.`);
      return randomQuiz.questions as QuizQA[];
    }

    return null;
  } catch (error) {
    console.error("Error fetching random quiz from DB:", error);
    return null; // Don't block execution if DB check fails
  }
}

/**
 * Saves a newly generated quiz to the database.
 * @param equipmentId - The ID of the equipment.
 * @param safetyTestId - The ID of the safety test.
 * @param questions - The array of questions to save.
 */
export async function saveQuizToDB(
  equipmentId: string | undefined,
  safetyTestId: string | undefined,
  questions: QuizQA[]
): Promise<void> {
  if ((!equipmentId && !safetyTestId) || !questions || questions.length === 0) {
    return;
  }

  try {
    await prisma.generatedQuiz.create({
      data: {
        equipmentId: equipmentId,
        safetyTestId: safetyTestId,
        questions: questions as any, // Prisma expects JsonValue, which QuizQA[] is compatible with
      },
    });
    console.log("✅ Saved newly generated quiz to DB cache.");
  } catch (error) {
    console.error("Error saving quiz to DB:", error);
    // Fail silently so it doesn't interrupt the user's quiz.
  }
}
