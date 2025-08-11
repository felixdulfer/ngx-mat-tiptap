import { generateHTML, generateJSON, generateText } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

/**
 * TipTap utility functions for HTML generation and conversion
 */

/**
 * Generates HTML from TipTap JSON content
 * @param jsonContent - The TipTap JSON content object
 * @returns HTML string representation of the content
 */
export function generateHTMLFromTiptap(jsonContent: any): string {
  if (!jsonContent || typeof jsonContent !== 'object') {
    return '';
  }

  try {
    return generateHTML(jsonContent, [StarterKit]);
  } catch (error) {
    console.error('Error generating HTML from TipTap content:', error);
    return '';
  }
}

/**
 * Converts HTML string to TipTap JSON format
 * @param htmlContent - The HTML string to convert
 * @returns TipTap JSON object representation of the HTML content
 */
export function generateTiptapFromHTML(htmlContent: string): any {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: []
        }
      ]
    };
  }

  try {
    return generateJSON(htmlContent, [StarterKit]);
  } catch (error) {
    console.error('Error generating TipTap content from HTML:', error);
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: []
        }
      ]
    };
  }
}

/**
 * Generates plain text from TipTap JSON content
 * @param jsonContent - The TipTap JSON content object
 * @returns Plain text string representation of the content
 */
export function generateTextFromTiptap(jsonContent: any): string {
  if (!jsonContent || typeof jsonContent !== 'object') {
    return '';
  }

  try {
    return generateText(jsonContent, [StarterKit]);
  } catch (error) {
    console.error('Error generating text from TipTap content:', error);
    return '';
  }
}

/**
 * Renders TipTap JSON content as HTML with optional CSS classes
 * @param jsonContent - The TipTap JSON content object
 * @param cssClass - Optional CSS class to apply to the rendered HTML
 * @returns HTML string with optional CSS class
 */
export function renderTiptapContent(jsonContent: any, cssClass?: string): string {
  const html = generateHTMLFromTiptap(jsonContent);

  if (!cssClass) {
    return html;
  }

  // Wrap the HTML in a div with the specified CSS class
  return `<div class="${cssClass}">${html}</div>`;
}

/**
 * Checks if the given content is empty TipTap content
 * @param content - The content to check
 * @returns True if the content is empty, false otherwise
 */
export function isTiptapContentEmpty(content: any): boolean {
  if (!content || typeof content !== 'object') {
    return true;
  }

  if (!content.content || !Array.isArray(content.content)) {
    return true;
  }

  if (content.content.length === 0) {
    return true;
  }

  // Check if content only contains empty paragraphs
  if (content.content.length === 1 && content.content[0].type === 'paragraph') {
    const paragraph = content.content[0];
    return !paragraph.content || paragraph.content.length === 0;
  }

  return false;
}
