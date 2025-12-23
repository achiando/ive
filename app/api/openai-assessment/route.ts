import { getQuizFromDB, saveQuizToDB } from '@/lib/actions/generated-quiz';
import { prisma } from '@/lib/prisma';
import {
  buildOpenAIPrompt,
  callOpenAIWithRetry,
  fetchManualText,
  parseQuestions,
} from '@/lib/utils/openai-quiz-generator';
import { QuizQA } from '@/types/assessment';
import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generateQuizWithAI(
  equipmentId: string | undefined,
  safetyTestId: string | undefined,
  manualUrl: string | undefined,
  documentTitle: string
): Promise<QuizQA[] | null> {
  let contentSource = '';
  
  // Priority 1: Direct manualUrl from request
  if (manualUrl) {
    try {
      contentSource = await fetchManualText(manualUrl);
      console.log('✅ Successfully fetched manual content from request URL.');
    } catch (error: any) {
      console.warn(`⚠️ Manual from request URL failed: ${error.message}. Proceeding to fallbacks.`);
    }
  }

  // Priority 2: Equipment - try its manual first, then its details
  if (!contentSource && equipmentId) {
    try {
      const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
      if (!equipment) throw new Error('Equipment not found.');

      if (equipment.manualUrl) {
        try {
          contentSource = await fetchManualText(equipment.manualUrl);
          console.log('✅ Successfully fetched manual content from equipment record.');
        } catch (manualError: any) {
          console.warn(`⚠️ Manual from equipment record failed: ${manualError.message}. Falling back to equipment details.`);
        }
      }

      if (!contentSource) {
        contentSource = `Equipment Name: ${equipment.name}\nDescription: ${equipment.description || 'N/A'}`;
        console.log('✅ Using equipment name/description as content source.');
      }
    } catch (error: any) {
      console.warn(`⚠️ Equipment fallback failed entirely: ${error.message}.`);
    }
  }
  
  // Priority 3: Safety Test - try its manual first, then its details
  if (!contentSource && safetyTestId) {
    try {
      const safetyTest = await prisma.safetyTest.findUnique({ where: { id: safetyTestId } });
      if (!safetyTest) throw new Error('Safety Test not found.');

      if (safetyTest.manualUrl) {
        try {
          contentSource = await fetchManualText(safetyTest.manualUrl);
          console.log('✅ Successfully fetched manual content from safety test record.');
        } catch (manualError: any) {
          console.warn(`⚠️ Manual from safety test record failed: ${manualError.message}. Falling back to safety test details.`);
        }
      }

      if (!contentSource) {
        contentSource = `Safety Test: ${safetyTest.name}\nDescription: ${safetyTest.description || 'N/A'}`;
        console.log('✅ Using safety test name/description as content source.');
      }
    } catch (error: any) {
      console.warn(`⚠️ Safety Test fallback failed entirely: ${error.message}.`);
    }
  }

  if (!contentSource) {
    console.error('❌ Could not resolve content from any available source.');
    return null;
  }

  // 2. Build Prompt and Call AI
  try {
    const assessmentPrompt = buildOpenAIPrompt(contentSource, documentTitle);
    const data = await callOpenAIWithRetry(assessmentPrompt);
    const responseText = data.choices?.[0]?.message?.content;

    if (!responseText) {
      console.error('❌ AI service returned an empty response.');
      return null;
    }
    return parseQuestions(responseText);
  } catch (error: any) {
    console.error(`❌ AI generation failed: ${error.message}`);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { safetyTestId, equipmentId, manualUrl, documentTitle, userMessage } = await req.json();
    console.log('Received request with:', { safetyTestId, equipmentId, manualUrl, documentTitle, userMessage });

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Server misconfiguration: OPENAI_API_KEY is not set.' }, { status: 500 });
    }

    // --- Clarification Logic ---
    if (userMessage) {
      let contentSource = '';
      // Simplified content resolution for clarification
      if (manualUrl) contentSource = await fetchManualText(manualUrl).catch(() => '');
      if (!contentSource && equipmentId) {
        const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
        contentSource = `Equipment Name: ${equipment?.name}\nDescription: ${equipment?.description || 'N/A'}`;
      }
      if (!contentSource && safetyTestId) {
        const safetyTest = await prisma.safetyTest.findUnique({ where: { id: safetyTestId } });
        contentSource = `Safety Test: ${safetyTest?.name}\nDescription: ${safetyTest?.description || 'N/A'}`;
      }
      if (!contentSource) return NextResponse.json({ error: 'Could not find content for clarification.' }, { status: 400 });

      const assessmentPrompt = buildOpenAIPrompt(contentSource, documentTitle, userMessage);
      const data = await callOpenAIWithRetry(assessmentPrompt);
      const responseText = data.choices?.[0]?.message?.content;
      return NextResponse.json({ result: { choices: [{ message: { content: responseText } }] } });
    }

    // --- QUIZ GENERATION LOGIC ---
    let questions: QuizQA[] | null = null;
    const useDB = Math.random() > 0.5; // 50% chance to try DB first

    if (useDB) {
      console.log('Attempting to fetch quiz from DB...');
      questions = await getQuizFromDB(equipmentId, safetyTestId);
    }

    if (!questions) {
      console.log(useDB ? 'DB empty or not chosen, generating with AI...' : 'AI chosen, generating new quiz...');
      questions = await generateQuizWithAI(equipmentId, safetyTestId, manualUrl, documentTitle);

      if (questions && questions.length > 0) {
        await saveQuizToDB(equipmentId, safetyTestId, questions);
      }
    }

    if (!questions || questions.length < 1) {
      return NextResponse.json({ error: 'Failed to generate or retrieve a valid quiz from any source.' }, { status: 422 });
    }

    const formattedContent = questions.map((q, i) => 
      `**Q${i + 1}.** ${q.question}\n` +
      `A. ${q.options[0]}\nB. ${q.options[1]}\nC. ${q.options[2]}\nD. ${q.options[3]}\n` +
      `**Answer: ${q.answer}** ${q.explanation}`
    ).join('\n\n');

    return NextResponse.json({ result: { choices: [{ message: { content: formattedContent } }] } });

  } catch (error: any) {
    console.error('❌ Top-level API error:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}