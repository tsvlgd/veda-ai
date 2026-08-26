'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { ExtractionResultSchema, type ExtractionResult } from '@/lib/schemas'

const EXTRACTION_PROMPT = `You are an expert assessment parser. You will receive two documents:
1. QUESTION PAPER — containing printed exam questions
2. STUDENT ANSWER SHEET — containing handwritten responses

TASK:
1. Extract every question from the question paper in correct printed order.
2. Extract every handwritten answer from the answer sheet.
3. Map each answer to its corresponding question by number/label.
4. Provide bounding box coordinates for each answer region on the answer sheet.
5. Provide brief grading feedback for each matched answer.

RULES:
- Treat labelled sub-parts as separate questions: "11(a)" and "11(b)" become TWO entries.
- Preserve original question numbering as the "label" field.
- Generate a unique id for each question: "q1", "q2", "q11_a", "q11_b", etc.
- Match answers by question number, not by position on the page.
- If an answer cannot be matched to any question, set questionId to null and status to "UNMATCHED".
- Unanswered questions simply have no mapping entry.
- Bounding box coordinates are percentages (0-100) relative to that page's width and height.
- coordinates is always an array — use multiple entries for answers spanning multiple pages.

OUTPUT: Return ONLY valid JSON (no markdown fences, no commentary) matching this structure:
{
  "questions": [
    { "id": "q1", "label": "1", "text": "Full question text" }
  ],
  "mappings": [
    {
      "questionId": "q1",
      "extractedAnswerText": "Brief summary of student's handwritten answer",
      "status": "ANSWERED",
      "feedback": "Brief evaluation of answer quality and correctness",
      "confidence": 0.95,
      "coordinates": [
        { "page": 1, "xmin": 5, "ymin": 10, "xmax": 90, "ymax": 35 }
      ]
    }
  ],
  "totalAnswerPages": 3
}

COORDINATE SYSTEM:
- page: 1-indexed page number on the answer sheet
- xmin, ymin: top-left corner as % of page width/height (0-100)
- xmax, ymax: bottom-right corner as % of page width/height (0-100)

Set totalAnswerPages to the actual number of pages in the answer sheet document.`

type ActionResult =
  | { success: true; data: ExtractionResult }
  | { success: false; error: string }

export async function processAssessment(formData: FormData): Promise<ActionResult> {
  const questionPaper = formData.get('questionPaper') as File | null
  const answerSheet = formData.get('answerSheet') as File | null

  if (!questionPaper || !answerSheet) {
    return { success: false, error: 'Both question paper and answer sheet are required.' }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { success: false, error: 'GEMINI_API_KEY is not configured on the server.' }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' })

    const [qpBuffer, asBuffer] = await Promise.all([
      questionPaper.arrayBuffer().then((b) => Buffer.from(b)),
      answerSheet.arrayBuffer().then((b) => Buffer.from(b)),
    ])

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: EXTRACTION_PROMPT },
            { text: '\n\nDOCUMENT 1 — QUESTION PAPER:' },
            {
              inlineData: {
                mimeType: questionPaper.type || 'application/pdf',
                data: qpBuffer.toString('base64'),
              },
            },
            { text: '\n\nDOCUMENT 2 — STUDENT ANSWER SHEET:' },
            {
              inlineData: {
                mimeType: answerSheet.type || 'application/pdf',
                data: asBuffer.toString('base64'),
              },
            },
          ],
        },
      ],
    })

    const rawText = result.response.text()

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: 'AI did not return valid JSON. Please retry.' }
    }

    const parsed = JSON.parse(jsonMatch[0])
    const validated = ExtractionResultSchema.parse(parsed)

    return { success: true, data: validated }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during extraction.'
    console.error('[processAssessment]', message)
    return { success: false, error: message }
  }
}
