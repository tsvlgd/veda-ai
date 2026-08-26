import { z } from 'zod'

export const BoundingBoxSchema = z.object({
  page: z.number().int().min(1),
  ymin: z.number().min(0).max(100),
  xmin: z.number().min(0).max(100),
  ymax: z.number().min(0).max(100),
  xmax: z.number().min(0).max(100),
})

export const QuestionSchema = z.object({
  id: z.string(),
  label: z.string(),
  text: z.string(),
})

export const AnswerMappingSchema = z.object({
  questionId: z.string().nullable(),
  extractedAnswerText: z.string(),
  status: z.enum(['ANSWERED', 'UNMATCHED']),
  feedback: z.string(),
  confidence: z.number().min(0).max(1),
  coordinates: z.array(BoundingBoxSchema),
})

export const ExtractionResultSchema = z.object({
  questions: z.array(QuestionSchema),
  mappings: z.array(AnswerMappingSchema),
  totalAnswerPages: z.number().int().min(1),
})

export type BoundingBox = z.infer<typeof BoundingBoxSchema>
export type Question = z.infer<typeof QuestionSchema>
export type AnswerMapping = z.infer<typeof AnswerMappingSchema>
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>
