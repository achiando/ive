"use server";

import { prisma } from "@/lib/prisma";
import OpenAI from "openai"; // Import OpenAI

export async function generateAssessmentFromEquipmentOpenAI(equipmentId: string, safetyTestName: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: {
      name: true,
      description: true,
      specifications: true,
      manualUrl: true,
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

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use an appropriate OpenAI model
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const text = chatCompletion.choices[0].message.content;
    if (!text) {
      throw new Error("OpenAI API returned no content.");
    }
    return text;
  } catch (error) {
    console.error("Error generating assessment from equipment using OpenAI:", error);
    throw new Error("Failed to generate assessment from equipment using OpenAI.");
  }
}