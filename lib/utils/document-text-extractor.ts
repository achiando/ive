import path from "path";
const pdf = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Fetches text content from a Google Doc URL.
 * This is an internal helper function.
 * @param googleDocUrl The URL of the Google Doc.
 * @returns A promise that resolves to the plain text content.
 */
async function fetchGoogleDocText(googleDocUrl: string): Promise<string> {
  console.log(`⚙️  Handling Google Doc URL: ${googleDocUrl}`);
  let fetchUrl = googleDocUrl;

  // Transform the URL to get the plain text export version
  if (googleDocUrl.includes('/pub')) {
    fetchUrl = googleDocUrl.replace(/\?.*$/, '') + '?output=txt';
  } else if (googleDocUrl.includes('/edit')) {
    const docId = googleDocUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
    if (docId) {
      fetchUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
    } else {
      throw new Error('Could not extract document ID from Google Doc edit URL');
    }
  }

  const response = await fetch(fetchUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ContentFetchingBot/1.0)' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Doc content: ${response.statusText}`);
  }

  let content = await response.text();

  // Clean up the text if it's HTML
  if (content.trim().startsWith('<!DOCTYPE html>')) {
    content = content
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return content;
}


/**
 * Extracts text content from a DOCX file buffer.
 * @param buffer The buffer of the .docx file.
 * @returns A promise that resolves to the extracted text.
 */
async function getTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Extracts text content from a PDF file buffer.
 * @param buffer The buffer of the .pdf file.
 * @returns A promise that resolves to the extracted text.
 */
async function getTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

/**
 * Takes a URL, fetches the document content in the browser, and extracts its text on the fly.
 *
 * @param url The URL of the document to process.
 * @returns The extracted text content as a string.
 * @throws An error if the file type is unsupported or if fetching/parsing fails.
 */
export async function extractTextFromDocument(
  url: string
): Promise<string> {
  
  // Handle Google Docs URLs as a special case for direct text extraction
  if (url.includes("docs.google.com")) {
    return fetchGoogleDocText(url);
  }

  // For all other cases, fetch the file and parse it based on its extension.
  let fileBuffer: Buffer;
  const sourceDescription = `URL (${url})`;

  try {
    console.log(`⬇️  Fetching content from ${sourceDescription}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    fileBuffer = Buffer.from(await response.arrayBuffer());

    const fileExtension = path.extname(url).split('?')[0].toLowerCase();
    let extractedText: string;

    console.log(`📄 Extracting text from ${fileExtension} file...`);
    switch (fileExtension) {
      case ".pdf":
        extractedText = await getTextFromPdf(fileBuffer);
        break;
      case ".docx":
        extractedText = await getTextFromDocx(fileBuffer);
        break;
      case ".txt":
        extractedText = fileBuffer.toString("utf-8");
        break;
      default:
        // If no extension, assume it's text
        if (!fileExtension) {
            console.log(`No file extension found, attempting to read as text.`);
            extractedText = fileBuffer.toString("utf-8");
        } else {
            throw new Error(`Unsupported file type for text extraction: ${fileExtension}`);
        }
    }

    if (!extractedText || !extractedText.trim()) {
      throw new Error("Extracted text is empty.");
    }

    console.log(`✅ Successfully extracted text from ${sourceDescription}`);
    return extractedText;
    
  } catch (error: any) {
    console.error(
      `❌ Failed to extract text from document at ${url}:`,
      error.message
    );
    throw new Error(
      `Could not get content from ${url}. Ensure the URL is correct and the file is accessible.`
    );
  }
}
