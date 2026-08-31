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
      className={`w-full rounded-2xl md:rounded-3xl bg-white p-5 text-left shadow-sm transition-all border ${
        active ? 'border-zinc-200' : 'border-transparent hover:border-zinc-200'
      }`}
    >
      <div className="flex flex-col">
        {/* Top Row */}
        <div className="flex items-center justify-between">
          <span
            className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
              active ? 'bg-zinc-800 text-white' : 'bg-zinc-600 text-white'
            }`}
          >
            {question.label}
          </span>
          <div className="flex items-center gap-3">
             <ScoreBadge mapping={mapping} />
             <ChevronDown
              className={`size-5 text-zinc-400 transition-transform ${active ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
        
        {/* Card Body */}
        <p className="mt-3 text-sm leading-relaxed text-zinc-800">{question.text}</p>
        
        {/* Expanded State */}
        {active && mapping && (
          <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-left">
            <p className="mb-1 text-sm font-semibold text-zinc-900">AI Feedback</p>
            <p className="text-xs leading-relaxed text-zinc-600">{mapping.feedback}</p>
          </div>
        )}
        {active && !mapping && (
           <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-left">
             <p className="text-xs leading-relaxed text-zinc-600">No answer was found for this question on the answer sheet.</p>
           </div>
        )}
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
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
      <div className="flex items-center justify-between px-2 pt-2">
        <h2 className="mb-4 mt-6 text-sm font-bold text-zinc-800">
          Extracted Questions <span className="font-normal">(from question paper)</span>
        </h2>
      </div>
      <div className="custom-scrollbar flex flex-1 flex-col space-y-4 overflow-y-auto px-1 pb-4">
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
