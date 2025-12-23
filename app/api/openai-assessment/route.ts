import { prisma } from '@/lib/prisma';
import {
  buildOpenAIPrompt,
  callOpenAIWithRetry,
  fetchManualText,
} from '@/lib/utils/openai-quiz-generator';
import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { safetyTestId, equipmentId, manualUrl, documentTitle, userMessage } = await req.json();
    console.log('Received request with:', { safetyTestId, equipmentId, manualUrl, documentTitle, userMessage });

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Server misconfiguration: OPENAI_API_KEY is not set.' }, { status: 500 });
    }

    // --- 1. Resolve Content Source ---
    let contentSource = '';
    
    try {
      if (manualUrl) {
        contentSource = await fetchManualText(manualUrl);
        console.log('✅ Successfully fetched manual content.');
      } else {
        // If no manual, immediately try fallbacks
        throw new Error("No manual URL provided.");
      }
    } catch (error: any) {
      console.warn(`⚠️ Primary content source failed: ${error.message}. Attempting fallbacks.`);
      
      if (equipmentId) {
        try {
          const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
          console.log('✅ Successfully fetched equipment details.', equipment);
          if (!equipment) throw new Error('Equipment not found for fallback.');
          contentSource = `Equipment Name: ${equipment.name}\nDescription: ${equipment.description || 'N/A'}\nSpecifications: ${JSON.stringify(equipment.specifications) || 'N/A'}`;
          console.log('✅ Using equipment details as fallback content source.');
        } catch (fallbackError: any) {
          console.warn(`⚠️ Equipment fallback failed: ${fallbackError.message}.`);
        }
      }
      
      if (!contentSource && safetyTestId) {
        try {
          const safetyTest = await prisma.safetyTest.findUnique({ where: { id: safetyTestId } });
          if (!safetyTest) throw new Error('Safety Test not found for fallback.');
          contentSource = `Safety Test: ${safetyTest.name}\nDescription: ${safetyTest.description || 'N/A'}`;
          console.log('✅ Using safety test details as fallback content source.');
        } catch (fallbackError: any) {
          console.warn(`⚠️ Safety Test fallback failed: ${fallbackError.message}.`);
        }
      }
    }

    if (!contentSource) {
      return NextResponse.json({ error: 'Could not resolve content from any available source.' }, { status: 422 });
    }

    // --- 2. Build Prompt ---
    const assessmentPrompt = buildOpenAIPrompt(contentSource, documentTitle, userMessage);

    // --- 3. Call AI ---
    const data = await callOpenAIWithRetry(assessmentPrompt);
    const responseText = data.choices?.[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json({ error: 'AI service returned an empty response.' }, { status: 500 });
    }

    // --- 4. Format and Return Response ---
    console.log(`✅ AI response generated successfully.`);

    return NextResponse.json({ result: { choices: [{ message: { content: responseText } }] } });

  } catch (error: any) {
    console.error('❌ Assessment API error:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}