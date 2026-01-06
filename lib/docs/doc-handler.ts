/**
 * @file src/lib/doc-handler.ts
 * @description Contains standalone functions for loading local file content.
 *              NOTE: Most functionality has been moved to document-text-extractor.ts
 */

import fs from 'fs';
import path from 'path';

/**
 * **Loader Function**
 * Reads and returns the content from a specified local file path.
 *
 * @param relativeFilePath The path relative to the project root of the file to load (e.g., 'public/manuals/doc1.txt').
 * @returns The content of the file as a string.
 * @throws An error if the file does not exist or cannot be read.
 *
 * @example
 * const manualContent = loadDoc('public/sop-manuals/safety-manual.txt');
 */
export function loadDoc(relativeFilePath: string): string {
  try {
    const absoluteFilePath = path.join(process.cwd(), relativeFilePath);
    const content = fs.readFileSync(absoluteFilePath, 'utf-8');
    console.log(`📄  Successfully loaded document from: ${relativeFilePath}`);
    return content;
  } catch (error: any) {
    console.error(`❌  Error loading document from ${relativeFilePath}:`, error.message);
    // Provide a more specific error if the file doesn't exist
    if (error.code === 'ENOENT') {
      throw new Error(`File not found at ${relativeFilePath}. Please ensure the document has been downloaded and saved.`);
    }
    throw error; // Re-throw other errors
  }
}