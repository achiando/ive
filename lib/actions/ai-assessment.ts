"use server";

import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateAssessmentFromEquipment(equipmentId: string, safetyTestName: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: {
      name: true,
      description: true,
      specifications: true,
      manualUrl: true, // Even if manualUrl is missing from SafetyTest, equipment might have one
    },
  });

  if (!equipment) {
    throw new Error("Equipment not found.");
  }

  let context = `Equipment Name: ${equipment.name}\n`;
  if (equipment.description) context += `Description: ${equipment.description}\n`;
  if (equipment.specifications) context += `Specifications: ${JSON.stringify(equipment.specifications)}\n`;
  if (equipment.manualUrl) context += `Equipment Manual URL: ${equipment.manualUrl}\n`;

  const prompt = `Based on the following equipment information and the safety test "${safetyTestName}", generate a 5-question multiple-choice safety assessment. Each question should have 4 options (A, B, C, D), a correct answer, and a brief explanation. Focus on safety procedures, operational hazards, and best practices related to this equipment.\n\nEquipment Information:\n${context}\n\nSafety Test Name: ${safetyTestName}\n\nFormat your response as follows:\n\n**Q1.** [Question text]\nA. [Option A]\nB. [Option B]\nC. [Option C]\nD. [Option D]\n**Answer:** [Correct Option Letter]\n**Explanation:** [Brief explanation]\n\n**Q2.** ...\n`;

  const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Use gemini-pro for text generation

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Error generating assessment from equipment:", error);
    throw new Error("Failed to generate assessment from equipment using AI.");
  }
}