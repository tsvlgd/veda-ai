'use client'

import { ChevronDown, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react'
import type { ExtractionResult, Question, AnswerMapping } from '@/lib/schemas'

interface QuestionsSidebarProps {
  data: ExtractionResult
  selectedQuestionId: string | null
  onSelectQuestion: (id: string) => void
}

function getMapping(data: ExtractionResult, questionId: string): AnswerMapping | undefined {
  return data.mappings.find((m) => m.questionId === questionId)
}

function StatusBadge({ mapping }: { mapping: AnswerMapping | undefined }) {
  if (!mapping) {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
        <AlertCircle className="size-3" /> Unanswered
      </span>
    )
  }
  if (mapping.status === 'UNMATCHED') {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
        <HelpCircle className="size-3" /> Unmatched
      </span>
    )
  }
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
      <CheckCircle2 className="size-3" /> Answered
    </span>
  )
}

function QuestionCard({
  question,
  mapping,
  active,
  onClick,
}: {
  question: Question
  mapping: AnswerMapping | undefined
  active: boolean
  onClick: () => void
}) {
  const isUnanswered = !mapping

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-3 text-left transition ${
        active
          ? 'border-orange-400 bg-orange-50/60 shadow-sm'
          : isUnanswered
            ? 'border-transparent bg-slate-50 opacity-70 hover:border-border hover:opacity-100'
            : 'border-transparent bg-background hover:border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold text-background ${
            active ? 'bg-orange-500' : isUnanswered ? 'bg-slate-400' : 'bg-foreground/70'
          }`}
        >
          {question.label}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-medium leading-5 text-foreground">{question.text}</p>
            <StatusBadge mapping={mapping} />
          </div>
          {active && mapping && (
            <div className="mt-3 space-y-2">
              <div className="rounded-lg bg-card p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Student&apos;s answer
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {mapping.extractedAnswerText}
                </p>
              </div>
              <div className="rounded-lg bg-card p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-orange-600">
                  AI feedback
                </p>
                <p className="text-xs leading-5 text-muted-foreground">{mapping.feedback}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Confidence:</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: `${mapping.confidence * 100}%` }}
                  />
                </div>
                <span className="font-mono font-semibold">
                  {Math.round(mapping.confidence * 100)}%
                </span>
              </div>
            </div>
          )}
          {active && isUnanswered && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">
                No answer was found for this question on the answer sheet.
              </p>
            </div>
          )}
        </div>
        <ChevronDown
          className={`mt-1 size-4 shrink-0 text-muted-foreground transition ${active ? 'rotate-180' : ''}`}
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
  const answeredCount = data.questions.filter((q) =>
    data.mappings.some((m) => m.questionId === q.id && m.status === 'ANSWERED'),
  ).length
  const unmatchedCount = data.mappings.filter((m) => m.questionId === null).length

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="text-sm font-bold">Extracted questions</h2>
          <p className="text-xs text-muted-foreground">
            {answeredCount}/{data.questions.length} answered
            {unmatchedCount > 0 && ` · ${unmatchedCount} unmatched`}
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {data.questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            mapping={getMapping(data, q.id)}
            active={q.id === selectedQuestionId}
            onClick={() => onSelectQuestion(q.id)}
          />
        ))}
        {unmatchedCount > 0 && (
          <>
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-600">
                Unmatched answers ({unmatchedCount})
              </p>
            </div>
            {data.mappings
              .filter((m) => m.questionId === null)
              .map((m, i) => (
                <div
                  key={`unmatched-${i}`}
                  className="rounded-xl border border-amber-200 bg-amber-50/50 p-3"
                >
                  <p className="text-[13px] font-medium text-foreground">
                    {m.extractedAnswerText}
                  </p>
                  <p className="mt-1 text-xs text-amber-600">{m.feedback}</p>
                </div>
              ))}
          </>
        )}
      </div>
    </section>
  )
}
