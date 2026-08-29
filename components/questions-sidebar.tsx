'use client'

import { ChevronDown } from 'lucide-react'
import type { ExtractionResult, Question, AnswerMapping } from '@/lib/schemas'

interface QuestionsSidebarProps {
  data: ExtractionResult
  selectedQuestionId: string | null
  onSelectQuestion: (id: string) => void
}

function getMapping(data: ExtractionResult, questionId: string): AnswerMapping | undefined {
  return data.mappings.find((m) => m.questionId === questionId)
}

function ScoreBadge({ mapping }: { mapping: AnswerMapping | undefined }) {
  if (!mapping) {
    return (
      <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
        0/2
      </span>
    )
  }

  const score = Math.round(mapping.confidence * 5)
  const maxScore = 5
  const isFullMarks = score === maxScore
  const isZero = score === 0

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
        isZero
          ? 'bg-red-100 text-red-700'
          : isFullMarks
            ? 'bg-green-100 text-green-700'
            : 'bg-green-100 text-green-700'
      }`}
    >
      {score}/{maxScore}
    </span>
  )
}

function QuestionCard({
  question,
  mapping,
  active,
  onClick,
  index,
}: {
  question: Question
  mapping: AnswerMapping | undefined
  active: boolean
  onClick: () => void
  index: number
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-3.5 text-left transition-all ${
        active
          ? 'border-orange-300 bg-orange-50/70 shadow-sm'
          : 'border-transparent bg-white hover:border-border hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
            active
              ? 'bg-orange-500 text-white'
              : 'border border-border bg-muted text-foreground'
          }`}
        >
          {question.label}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-medium leading-5 text-foreground">{question.text}</p>
            <ScoreBadge mapping={mapping} />
          </div>
          {active && mapping && (
            <div className="mt-3">
              <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-border/50">
                <p className="mb-1.5 text-[11px] font-bold text-foreground">
                  AI Feedback
                </p>
                <p className="text-xs leading-5 text-muted-foreground">{mapping.feedback}</p>
              </div>
            </div>
          )}
          {active && !mapping && (
            <div className="mt-3 rounded-lg bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">
                No answer was found for this question on the answer sheet.
              </p>
            </div>
          )}
        </div>
        <ChevronDown
          className={`mt-0.5 size-4 shrink-0 text-muted-foreground transition ${active ? 'rotate-180' : ''}`}
        />
      </div>
    </button>
  )
}

export default function QuestionsSidebar({
  data,
  selectedQuestionId,
  onSelectQuestion,
}: QuestionsSidebarProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <h2 className="text-sm font-bold text-foreground">
          Extracted Questions{' '}
          <span className="font-normal text-muted-foreground">(from question paper)</span>
        </h2>
        <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition">
          Expand All
        </button>
      </div>
      <div className="custom-scrollbar flex flex-1 flex-col gap-1.5 overflow-y-auto p-3">
        {data.questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            mapping={getMapping(data, q.id)}
            active={q.id === selectedQuestionId}
            onClick={() => onSelectQuestion(q.id)}
            index={i}
          />
        ))}
      </div>
    </section>
  )
}
