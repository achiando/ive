import { extractTextFromDocument } from '@/lib/utils/document-text-extractor';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log('--- /api/extract-text endpoint hit ---');
  try {
    console.log('Step 1: Parsing request body...');
    const { url } = await req.json();
    console.log(`Step 2: Received URL: ${url}`);

    if (!url) {
      console.log('Error: URL is missing.');
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('Step 3: Calling extractTextFromDocument...');
    const text = await extractTextFromDocument(url);
    console.log('Step 4: Successfully extracted text.');

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error('--- API CATCH BLOCK ---');
    console.error('API Error extracting text:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('--- END API CATCH BLOCK ---');
    return NextResponse.json({ error: error.message || 'Failed to extract text' }, { status: 500 });
  }
}