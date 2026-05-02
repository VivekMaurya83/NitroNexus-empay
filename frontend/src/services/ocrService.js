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

/**
 * Uses Groq to parse unstructured CSV text into an array of strictly typed Employee objects.
 * @param {string} csvText - The raw text from the CSV upload
 * @param {Array<{id, name}>} departmentsList - List of available departments
 * @returns {Promise<Array<object>>} - Array of parsed employee data objects
 */
export async function parseCSVWithGroq(csvText, departmentsList) {
  const deptsJson = JSON.stringify(departmentsList.map(d => ({ id: d.id, name: d.name })));
  
  const prompt = `You are a strict data processing assistant. 
I have a raw CSV/Excel file containing employee details. The columns might be messy, unstructured, or randomly placed.
Intelligently classify the data into a strict JSON array of objects.
Max 10 employees. Ignore empty rows.

Valid Employment Types: "full_time", "part_time", "contract", "intern"
Valid Departments: ${deptsJson}

Return ONLY a JSON array of objects (no markdown, no preamble) where each object strictly has:
{
  "first_name": "extracted given name (required)",
  "last_name": "extracted surname (required)",
  "email": "extracted email (required)",
  "date_of_joining": "YYYY-MM-DD format (required)",
  "employment_type": "one of the valid types, default to 'full_time'",
  "phone": "extracted phone or empty string",
  "date_of_birth": "YYYY-MM-DD format or empty string",
  "department_id": "if a department name closely matches one of the Valid Departments, put its numeric ID here, otherwise null"
}

Raw Data:
---
${csvText}
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

  let jsonStr = rawText.trim();
  
  // 1. Try to extract from a ```json block
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1].trim().startsWith('[')) {
    jsonStr = jsonMatch[1].trim();
  } else {
    // 2. Fallback: Find the first '[' and last ']'
    const firstIdx = rawText.indexOf('[');
    const lastIdx = rawText.lastIndexOf(']');
    if (firstIdx !== -1 && lastIdx !== -1 && lastIdx > firstIdx) {
      jsonStr = rawText.substring(firstIdx, lastIdx + 1);
    }
  }

  try {
    const parsedArray = JSON.parse(jsonStr);
    if (!Array.isArray(parsedArray)) throw new Error('Root is not an array');
    return parsedArray.slice(0, 10); // Enforce max 10
  } catch (err) {
    console.error("Groq Raw Response:", rawText);
    console.error("Attempted JSON string:", jsonStr);
    throw new Error('Groq returned invalid JSON array. Check the console for raw output.');
  }
}
