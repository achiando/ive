import { getQuizFromDB, saveQuizToDB } from '@/lib/actions/generated-quiz';
import {
  buildOpenAIPrompt,
  callOpenAIWithRetry,
  parseQuestions,
} from '@/lib/utils/openai-quiz-generator';
import { QuizQA } from '@/types/assessment';
import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generateQuizWithAI(
  manualText: string,
  documentTitle: string
): Promise<QuizQA[] | null> {
  if (!manualText) {
    console.error('❌ Could not generate quiz: manualText is empty.');
    return null;
  }

  // Build Prompt and Call AI
  try {
    const assessmentPrompt = buildOpenAIPrompt(manualText, documentTitle);
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
    const { safetyTestId, equipmentId, manualText, documentTitle, userMessage } = await req.json();
    console.log('Received request with:', { safetyTestId, equipmentId, documentTitle, userMessage });

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Server misconfiguration: OPENAI_API_KEY is not set.' }, { status: 500 });
    }

    // --- Clarification Logic ---
    if (userMessage) {
      // For clarification, we use the provided manualText directly.
      if (!manualText) return NextResponse.json({ error: 'Could not find content for clarification.' }, { status: 400 });

      const assessmentPrompt = buildOpenAIPrompt(manualText, documentTitle, userMessage);
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
      questions = await generateQuizWithAI(manualText, documentTitle);

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