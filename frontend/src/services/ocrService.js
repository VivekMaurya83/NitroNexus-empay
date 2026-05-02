/**
 * ocrService.js
 * Handles image text extraction via SpaceOCR and smart field parsing via Groq.
 */

const SPACE_OCR_KEY = import.meta.env.VITE_SPACE_OCR_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

/**
 * Extracts text from an image file using SpaceOCR API.
 * @param {File} file - The image file to process
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromImage(file) {
  const formData = new FormData();
  formData.append('apikey', SPACE_OCR_KEY);
  formData.append('file', file);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('OCREngine', '2'); // More accurate engine

  const res = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`SpaceOCR request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (data.IsErroredOnProcessing) {
    throw new Error('OCR Error: ' + (data.ErrorMessage?.[0] || 'Unknown error'));
  }

  const text = data.ParsedResults?.[0]?.ParsedText;
  if (!text) throw new Error('No text could be extracted from the image.');
  return text;
}

/**
 * Uses Groq to parse extracted OCR text and return structured leave fields.
 * @param {string} ocrText - Raw text extracted by OCR
 * @returns {Promise<{leaveType, fromDate, toDate, reason, daysInfo}>}
 */
export async function parseLeaveDetailsWithAI(ocrText) {
  const today = new Date().toISOString().split('T')[0];

  const prompt = `You are an HR assistant parsing a medical certificate or leave application document.

Today's date is: ${today}

Extract leave details from this text and return ONLY valid JSON (no markdown, no explanation):
{
  "leaveType": "sick" | "casual" | "earned" | "maternity" | "paternity" | "unpaid" | "comp_off",
  "fromDate": "YYYY-MM-DD or empty string if not found",
  "toDate": "YYYY-MM-DD or empty string if not found",
  "reason": "brief reason extracted from text",
  "notes": "any important note like 'document mentions 3 days rest, start date not specified'"
}

Rules:
- If the document says "X days rest" or "rest for X days" but gives no date range, set fromDate and toDate to empty strings and mention this in notes.
- If only a start date is given and N days are mentioned, calculate toDate = startDate + N days.
- If it's a medical/doctor certificate, leaveType should be "sick".
- If dates are in DD/MM/YYYY or DD-MM-YYYY format, convert to YYYY-MM-DD.
- Keep reason concise (under 100 characters).

Document text:
---
${ocrText}
---`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawText = data?.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Groq returned no content.');

  // Strip any markdown code fences if present
  const cleaned = rawText.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Groq returned invalid JSON: ' + cleaned.slice(0, 100));
  }
}
