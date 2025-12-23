import { QuizQA } from '@/types/assessment'; // Import the shared QuizQA type

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Simple in-memory cache for manual text (use Redis in production)
const manualCache = new Map<string, string>();

export async function fetchManualText(manualUrl: string): Promise<string> {
  // Validate input URL
  if (!manualUrl || typeof manualUrl !== 'string') {
    throw new Error('Invalid Manual URL provided');
  }

  // Check cache first
  if (manualCache.has(manualUrl)) {
    const cachedText = manualCache.get(manualUrl);
    if (cachedText && typeof cachedText === 'string') {
      return cachedText;
    }
  }

  try {
    // For published Google Docs, we need to fetch the HTML and extract text
    let fetchUrl = manualUrl;

    // Ensure we're using the published version without embedded parameter
    if (manualUrl.includes('docs.google.com') && manualUrl.includes('/pub')) {
      fetchUrl = manualUrl.replace(/\?.*$/, '') + '?output=txt';
    } else if (manualUrl.includes('docs.google.com') && manualUrl.includes('/edit')) {
      // Handle edit URLs by converting to export format
      const docId = manualUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (docId) {
        fetchUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
      } else {
        throw new Error('Could not extract document ID from URL');
      }
    }

    const res = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Assessment Bot)'
      }
    });

    if (!res.ok) {
      console.error(`❌ Failed to fetch document: ${res.status} ${res.statusText} for URL: ${fetchUrl}`);
      throw new Error(`Failed to fetch manual content: ${res.status} ${res.statusText}`);
    }

    let content = await res.text();

    // If we got HTML instead of plain text, extract text from HTML
    if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
      console.log(' Extracting text from HTML document...');

      // Simple HTML text extraction - remove scripts, styles, and tags
      content = content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
        .replace(/<[^>]+>/g, ' ') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    }

    console.log(`✅ Successfully extracted ${content.length} characters from document`);

    // Validate the response
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new Error('Document appears to be empty or inaccessible');
    }

    if (content.trim().length < 100) {
      throw new Error('Document content is too short to generate meaningful questions');
    }

    // Cache the result only if it's valid
    manualCache.set(manualUrl, content);
    return content;

  } catch (error: any) {
    console.error('Error fetching manual text:', error);
    throw new Error(`Unable to access document: ${error.message}`);
  }
}

export function extractKeyContent(manualText: string): string {
  // Handle undefined, null, or empty manualText
  if (!manualText || typeof manualText !== 'string') {
    return '';
  }

  const lines = manualText.split('\n').map(line => line.trim()).filter(line => line);

  // Handle case where no lines are found
  if (!lines || lines.length === 0) {
    return '';
  }

  // Look for important sections (safety, procedures, warnings, etc.)
  const keyTerms = ['safety', 'warning', 'caution', 'procedure', 'step', 'operation', 'hazard', 'protection', 'emergency'];
  const importantLines = lines.filter(line => {
    // Ensure line is defined before checking properties
    if (!line || typeof line !== 'string') return false;

    return keyTerms.some(term => line.toLowerCase().includes(term)) ||
      line.match(/^\d+\./) || // Numbered steps
      line.length > 50;
  });

  // If we found important content, use it; otherwise use first part of manual
  const content = importantLines.length > 10 ? importantLines.join(' ') : lines.join(' ');

  // Handle case where content is undefined or null
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Truncate to optimal length for faster processing
  return content.length > 2500 ? content.substring(0, 2500) + '...' : content;
}

export function buildOpenAIPrompt(contentSource: string, safetyTestName: string, userMessage?: string) {
  const optimizedContent = extractKeyContent(contentSource);
  const contentToUse = (!optimizedContent || optimizedContent.trim().length < 50)
    ? contentSource
    : optimizedContent;

  if (!contentToUse || contentToUse.trim().length < 10) {
    throw new Error('Content source appears to be empty or inaccessible');
  }

  const wordCount = contentToUse.split(/\s+/).filter(word => word.length > 0).length;
  const numQuestions = wordCount > 800 ? 11 : 9;

  const systemMessage = `You are a safety expert and a quiz generator. Your task is to create safety-focused questions or provide clear answers based on the provided SOP content.`;

  if (userMessage) {
    return [
      { role: "system", content: systemMessage },
      { role: "user", content: `Based on the SOP content below, provide a clear, helpful answer to the following question. Focus on safety procedures, best practices, and practical guidance.\n\nSOP Content:\n${contentToUse}\n\nUser Question: ${userMessage}\n\nProvide a concise but thorough answer that helps them understand the safety procedures and requirements:` }
    ];
  }

  const finalContent = contentToUse.length > 3000
    ? contentToUse.substring(0, 3000)
    : contentToUse;

  return [
    { role: "system", content: systemMessage },
    { role: "user", content: `Create EXACTLY ${numQuestions} safety quiz questions from the following content related to the safety test "${safetyTestName}". Follow this PRECISE format for each question:\n\n**Q1.** [Clear question text]\nA. [Option A text]\nB. [Option B text] \nC. [Option C text]\nD. [Option D text]\n**Answer: X** [Brief explanation why this is correct]\n\n**Q2.** [Next question...]\n\nIMPORTANT RULES:\n- Generate exactly ${numQuestions} questions, no more, no less\n- Each question must have exactly 4 options (A, B, C, D)\n- Mark the correct answer clearly with **Answer: [Letter]**\n- Focus on safety procedures, equipment operation, hazards, and best practices\n- Make questions practical and relevant to actual SOP usage\n\nContent: ${finalContent}` }
  ];
}

export async function callOpenAIWithRetry(messages: Array<{ role: string; content: string }>, retryCount = 0): Promise<any> {
  const maxRetries = 4;

  if (!OPENAI_API_KEY) {
    throw new Error('Server misconfiguration: OPENAI_API_KEY is not set.');
  }

  try {
    const openaiRes = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Or gpt-4, depending on preference/cost
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.8,
        frequency_penalty: 0,
        presence_penalty: 0,
      })
    });
    console.log('✅ OpenAI API response received', openaiRes);

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      const error = new Error(`OpenAI API error: ${openaiRes.status} - ${errorText}`);

      if (openaiRes.status === 500 || openaiRes.status === 503 || openaiRes.status === 429) {
        if (retryCount < maxRetries) {
          const delay = Math.min(Math.pow(2, retryCount) * 2000, 30000);
          console.log(`OpenAI API error (${openaiRes.status}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return callOpenAIWithRetry(messages, retryCount + 1);
        }
      }

      throw error;
    }

    const data = await openaiRes.json();

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response structure from OpenAI API');
    }

    const responseText = data.choices[0].message.content;

    const isClarificationRequest = messages.some(msg => msg.content.includes('User Question:'));
    if (!isClarificationRequest && !responseText.includes('**Q') && !responseText.includes('Q1')) {
      if (retryCount < maxRetries) {
        console.log('Response format invalid, retrying...');
        const delay = 1000 * (retryCount + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callOpenAIWithRetry(messages, retryCount + 1);
      }
      throw new Error('Response does not contain expected question format');
    }

    return data;

  } catch (error: any) {
    console.error(`OpenAI API attempt ${retryCount + 1} failed:`, error.message);

    if (retryCount < maxRetries && (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Invalid response')
    )) {
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return callOpenAIWithRetry(messages, retryCount + 1);
    }

    throw error;
  }
}

// Helper function to parse questions from OpenAI's raw text response
export const parseQuestions = (text: string): QuizQA[] => {
  if (!text) return [];
  
  const questions: QuizQA[] = [];
  // Regex to capture each question block
  const questionRegex = /\*\*Q(\d+)\.\s*([\s\S]*?)\n(A\.[\s\S]*?)\n(B\.[\s\S]*?)\n(C\.[\s\S]*?)\n(D\.[\s\S]*?)\n\*\*Answer:\s*([A-D])\*\*\s*([\s\S]*?(?=\*\*Q\d+\.|\n\n|$))/g;

  let match;
  while ((match = questionRegex.exec(text)) !== null) {
    const [, , questionText, optionA, optionB, optionC, optionD, answerLetter, explanationText] = match;

    const options = [
      optionA.substring(2).trim(),
      optionB.substring(2).trim(),
      optionC.substring(2).trim(),
      optionD.substring(2).trim(),
    ];

    questions.push({
      question: questionText.trim(),
      options: options,
      answer: answerLetter.trim(),
      explanation: explanationText.trim(),
    });
  }
  return questions;
};
