// lib/actions/quiz-generation.ts
"use server";

import { prisma } from "@/lib/prisma";
import { QuizQA } from "@/types/assessment";
import {
  fetchManualText,
  buildOpenAIPrompt,
  callOpenAIWithRetry,
  generateAssessmentFromEquipmentOpenAI,
  parseQuestions,
} from "@/lib/utils/openai-quiz-generator";
import { getSafetyTestById } from "./safety-test"; // Assuming this is the correct path

export async function getOrCreateQuizQuestions(
  safetyTestId: string | undefined,
  equipmentId: string | undefined,
  manualUrl: string | null | undefined,
  documentTitle: string
): Promise<QuizQA[]> {
  try {
    let questions: QuizQA[] | null = null;
    const shouldTryLoadingFromDB = Math.random() < 0.5; // 50% chance to try loading from DB

    if (shouldTryLoadingFromDB) {
      // Try to load from DB
      const existingQuiz = await prisma.generatedQuiz.findFirst({
        where: {
          safetyTestId: safetyTestId || null,
          equipmentId: equipmentId || null,
        },
      });

      if (existingQuiz) {
        console.log("✅ Loaded quiz from database.");
        questions = existingQuiz.questions as QuizQA[];
      }
    }

    if (!questions) {
      console.log("Generating new quiz questions...");
      // Logic to generate new questions (similar to the API route)
      let contentSource = '';
      let generatedQuestionsText: string | undefined;

      const getEquipmentContent = async (
        eqId: string | undefined,
        docTitle: string
      ): Promise<string> => {
        if (!eqId) {
          throw new Error('Equipment ID is required for fallback content generation.');
        }

        let actualSafetyTestName = docTitle;
        if (safetyTestId) {
          const safetyTest = await getSafetyTestById(safetyTestId);
          if (safetyTest) {
            actualSafetyTestName = safetyTest.name;
          }
        }
        return await generateAssessmentFromEquipmentOpenAI(eqId, actualSafetyTestName);
      };

      if (manualUrl) {
        try {
          contentSource = await fetchManualText(manualUrl);
        } catch (error: unknown) {
          console.warn('⚠️ Could not fetch manual, falling back to equipment details.');
          if (equipmentId) {
            contentSource = await getEquipmentContent(equipmentId, documentTitle);
          } else {
            throw new Error('No manual URL and no equipment ID to generate content from.');
          }
        }
      } else if (equipmentId) {
        contentSource = await getEquipmentContent(equipmentId, documentTitle);
      } else {
        throw new Error('No manual URL or equipment ID provided to generate assessment.');
      }

      if (!contentSource || contentSource.trim().length < 100) {
        throw new Error('Unable to extract sufficient content for assessment generation.');
      }

      const openaiMessages = buildOpenAIPrompt(contentSource, documentTitle);
      const data = await callOpenAIWithRetry(openaiMessages);
      generatedQuestionsText = data.choices?.[0]?.message?.content;

      if (!generatedQuestionsText) {
        throw new Error('OpenAI API returned no content for quiz generation.');
      }

      questions = parseQuestions(generatedQuestionsText);

      // Save the newly generated quiz to the database
      if (questions.length > 0) {
        await prisma.generatedQuiz.upsert({
          where: {
            safetyTestId_equipmentId: {
              safetyTestId: safetyTestId || null,
              equipmentId: equipmentId || null,
            },
          },
          update: {
            questions: questions as any, // Prisma needs JsonValue, QuizQA[] is compatible
          },
          create: {
            safetyTestId: safetyTestId,
            equipmentId: equipmentId,
            questions: questions as any,
          },
        });
        console.log("✅ Saved newly generated quiz to database.");
      }
    }

    if (!questions || questions.length === 0) {
      throw new Error('No valid questions could be generated or retrieved.');
    }

    return questions;
  } catch (error: any) {
    console.error("Error in getOrCreateQuizQuestions:", error);
    throw new Error(`Failed to get or create quiz questions: ${error.message}`);
  }
}
