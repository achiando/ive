import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateAssessmentFromEquipment } from '@/lib/actions/ai-assessment';
import { getSafetyTestById } from '@/lib/actions/safety-test';

// Gemini API configuration
const GOOGLE_API_KEY = process.env.GEMINI_API_KEY; // Use GEMINI_API_KEY as defined in lib/actions/ai-assessment.ts
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Simple in-memory cache for manual text (use Redis in production)
const manualCache = new Map<string, string>();

async function fetchManualText(manualUrl: string): Promise<string> {
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

// Extract key safety information from manual text
function extractKeyContent(manualText: string): string {
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
      line.length > 50; // Substantial content
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

function buildPrompt(contentSource: string, safetyTestName: string, userMessage?: string) {
  // Extract and optimize manual content
  const optimizedContent = extractKeyContent(contentSource);
  
  // Use original manual text if extraction returns insufficient content
  const contentToUse = (!optimizedContent || optimizedContent.trim().length < 50) 
    ? contentSource 
    : optimizedContent;
  
  // Final validation - ensure we have some content to work with
  if (!contentToUse || contentToUse.trim().length < 10) {
    throw new Error('Content source appears to be empty or inaccessible');
  }
  
  const wordCount = contentToUse.split(/\s+/).filter(word => word.length > 0).length;
  
  const numQuestions = wordCount > 800 ? 11 : 9; // Lower threshold for faster processing
  
  if (userMessage) {
    return `You are a safety expert helping someone understand an SOP manual. Based on the SOP content below, provide a clear, helpful answer to their question. Focus on safety procedures, best practices, and practical guidance.\n\nSOP Content:\n${contentToUse}\n\nUser Question: ${userMessage}\n\nProvide a concise but thorough answer that helps them understand the safety procedures and requirements:`;
  }
  
  // Truncate content if too long for better performance
  const finalContent = contentToUse.length > 3000 
    ? contentToUse.substring(0, 3000)
    : contentToUse;

  return `Create EXACTLY ${numQuestions} safety quiz questions from the following content related to the safety test "${safetyTestName}". Follow this PRECISE format for each question:\n\n**Q1.** [Clear question text]\nA. [Option A text]\nB. [Option B text] \nC. [Option C text]\nD. [Option D text]\n**Answer: X** [Brief explanation why this is correct]\n\n**Q2.** [Next question...]\n\nIMPORTANT RULES:\n- Generate exactly ${numQuestions} questions, no more, no less\n- Each question must have exactly 4 options (A, B, C, D)\n- Mark the correct answer clearly with **Answer: [Letter]**\n- Focus on safety procedures, equipment operation, hazards, and best practices\n- Make questions practical and relevant to actual SOP usage\n\nContent: ${finalContent}`;
}

async function callGeminiWithRetry(prompt: string, retryCount = 0): Promise<any> {
  const maxRetries = 4; // Increased retries for 503 errors
  
  if (!GOOGLE_API_KEY) {
    throw new Error('Server misconfiguration: GEMINI_API_KEY is not set.');
  }

  try {
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7,
          maxOutputTokens: 2000,
          candidateCount: 1,
          topP: 0.8,
          topK: 40
        }
      })
    });
    
    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      const error = new Error(`Gemini API error: ${geminiRes.status} - ${errorText}`);
      
      // Check if it's a 503 (overloaded) or 429 (rate limit) error
      if (geminiRes.status === 503 || geminiRes.status === 429) {
        if (retryCount < maxRetries) {
          // Longer delay for server overload issues
          const delay = Math.min(Math.pow(2, retryCount) * 2000, 30000); // Cap at 30 seconds
          console.log(`Server overloaded (${geminiRes.status}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return callGeminiWithRetry(prompt, retryCount + 1);
        }
      }
      
      throw error;
    }

    const data = await geminiRes.json();
    
    // Validate response structure
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response structure from Gemini API');
    }
    
    const responseText = data.candidates[0].content.parts[0].text;
    
    // Only validate question format for quiz generation (not clarification requests)
    const isClarificationRequest = prompt.includes('You are a safety expert helping someone understand');
    if (!isClarificationRequest && !responseText.includes('**Q') && !responseText.includes('Q1')) {
      if (retryCount < maxRetries) {
        console.log('Response format invalid, retrying...');
        const delay = 1000 * (retryCount + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callGeminiWithRetry(prompt, retryCount + 1);
      }
      throw new Error('Response does not contain expected question format');
    }
    
    return data;
    
  } catch (error: any) {
    console.error(`Gemini API attempt ${retryCount + 1} failed:`, error.message);
    
    // Retry for network errors or parsing issues
    if (retryCount < maxRetries && (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Invalid response')
    )) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Network/parsing error, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGeminiWithRetry(prompt, retryCount + 1);
    }
    
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { safetyTestId, equipmentId, manualUrl, documentTitle, userMessage } = await req.json();
    
    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'Server misconfiguration: GEMINI_API_KEY is not set.' }, { status: 500 });
    }

    let contentSource = '';
    let assessmentPrompt = '';

    if (userMessage) { // Clarification request
      if (manualUrl) {
        contentSource = await fetchManualText(manualUrl);
      } else if (equipmentId && safetyTestId) {
        // Fetch safety test name for context
        const safetyTest = await getSafetyTestById(safetyTestId);
        if (!safetyTest) throw new Error("Safety Test not found for context.");
        contentSource = await generateAssessmentFromEquipment(equipmentId, safetyTest.name);
      } else {
        return NextResponse.json({ error: 'Missing content source for clarification' }, { status: 400 });
      }
      assessmentPrompt = buildPrompt(contentSource, documentTitle, userMessage);
    } else { // Quiz generation request
      if (manualUrl) {
        contentSource = await fetchManualText(manualUrl);
      } else if (equipmentId && safetyTestId) {
        // Fetch safety test name for context
        const safetyTest = await getSafetyTestById(safetyTestId);
        if (!safetyTest) throw new Error("Safety Test not found for context.");
        contentSource = await generateAssessmentFromEquipment(equipmentId, safetyTest.name);
      } else {
        return NextResponse.json({ error: 'Missing content source for assessment generation' }, { status: 400 });
      }
      assessmentPrompt = buildPrompt(contentSource, documentTitle);
    }

    if (!contentSource || contentSource.trim().length < 100) {
      return NextResponse.json({ error: 'Unable to extract sufficient content for assessment generation.' }, { status: 400 });
    }
    
    // 3. Call Gemini API with retry logic
    const data = await callGeminiWithRetry(assessmentPrompt);
    
    // Log successful response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const isClarificationRequest = userMessage && userMessage.trim().length > 0;
    
    if (isClarificationRequest) {
      console.log(`✅ Clarification response generated successfully`);
      console.log(' Response preview:', responseText?.substring(0, 200));
    } else {
      const questionCount = (responseText?.match(/\*\*Q\d+\./g) || []).length;
      console.log(`✅ Assessment generated successfully with ${questionCount} questions`);
      console.log(' Response text preview:', responseText?.substring(0, 500));
    }
    
    return NextResponse.json({ result: data });
    
  } catch (error: any) {
    console.error('Assessment API error:', error);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error.message.includes('Unable to access document')) {
      errorMessage = 'Unable to access the document. Please check the manual URL.';
      statusCode = 400;
    } else if (error.message.includes('503') || error.message.includes('overloaded')) {
      errorMessage = 'The AI service is temporarily overloaded. Please try again in a few minutes.';
      statusCode = 503;
    } else if (error.message.includes('429') || error.message.includes('rate limit')) {
      errorMessage = 'Too many requests. Please wait a moment and try again.';
      statusCode = 429;
    } else if (error.message.includes('Gemini API')) {
      errorMessage = 'AI service temporarily unavailable. Please try again in a moment.';
      statusCode = 502;
    } else if (error.message.includes('question format')) {
      errorMessage = 'Unable to generate properly formatted questions. Please try again.';
      statusCode = 422;
    } else if (error.message.includes('insufficient content')) {
      errorMessage = 'The content is too short to generate a meaningful assessment.';
      statusCode = 400;
    } else if (error.message.includes('Equipment not found')) {
      errorMessage = 'The specified equipment was not found for assessment generation.';
      statusCode = 404;
    } else if (error.message.includes('Safety Test not found')) {
      errorMessage = 'The specified safety test was not found for context.';
      statusCode = 404;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}


