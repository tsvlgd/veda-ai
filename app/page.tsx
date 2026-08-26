'use client'

import { useState, useCallback } from 'react'
import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  FileText,
  Grid2X2,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'

import { processAssessment } from '@/app/actions'
import type { ExtractionResult } from '@/lib/schemas'
import FileUploader from '@/components/file-uploader'
import QuestionsSidebar from '@/components/questions-sidebar'
import DocumentWorkspace from '@/components/document-workspace'

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid size-9 place-items-center rounded-xl bg-foreground text-background">
        <span className="text-lg font-black">V</span>
      </div>
      <span className="text-xl font-bold tracking-tight">VedaAI</span>
    </div>
  )
}

function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[238px] flex-col border-r border-border bg-card p-5 transition-transform lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex items-center justify-between">
        <Logo />
        <button
          className="rounded-lg p-2 text-muted-foreground lg:hidden"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X />
        </button>
      </div>
      <div className="mt-8 rounded-2xl bg-foreground p-3 text-background">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-4 text-orange-400" /> AI Teacher&apos;s Toolkit
        </div>
        <p className="mt-1 text-xs text-background/60">Grade smarter, not harder</p>
      </div>
      <nav className="mt-8 flex flex-col gap-1 text-sm">
        {(
          [
            ['Home', LayoutDashboard],
            ['My Classroom', Grid2X2],
            ['Assignments', ClipboardList],
            ['Exams', BookOpen],
            ['My Library', FileText],
          ] as const
        ).map(([label, Icon]) => (
          <button
            key={label}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left ${label === 'Exams' ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Icon className="size-[18px]" />
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-5">
        <button className="flex items-center gap-3 px-3 text-sm text-muted-foreground">
          <Settings className="size-[18px]" /> Settings
        </button>
        <div className="rounded-2xl bg-muted p-3">
          <p className="text-sm font-semibold">Delhi Public School</p>
          <p className="text-xs text-muted-foreground">Bokaro Steel City</p>
        </div>
      </div>
    </aside>
  )
}

export default function Page() {
  const [questionPaper, setQuestionPaper] = useState<File | null>(null)
  const [answerSheet, setAnswerSheet] = useState<File | null>(null)
  const [answerSheetUrl, setAnswerSheetUrl] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mobileMenu, setMobileMenu] = useState(false)

  const handleAnswerSheetChange = useCallback((file: File | null) => {
    setAnswerSheet(file)
    if (answerSheetUrl) URL.revokeObjectURL(answerSheetUrl)
    setAnswerSheetUrl(file ? URL.createObjectURL(file) : null)
  }, [answerSheetUrl])

  const handleStart = useCallback(async () => {
    if (!questionPaper || !answerSheet) return
    setIsProcessing(true)
    setError(null)

    const formData = new FormData()
    formData.append('questionPaper', questionPaper)
    formData.append('answerSheet', answerSheet)

    const result = await processAssessment(formData)

    if (result.success) {
      setExtractedData(result.data)
      if (result.data.questions.length > 0) {
        setSelectedQuestionId(result.data.questions[0].id)
      }
    } else {
      setError(result.error)
    }
    setIsProcessing(false)
  }, [questionPaper, answerSheet])

  const handleReset = useCallback(() => {
    setQuestionPaper(null)
    setAnswerSheet(null)
    if (answerSheetUrl) URL.revokeObjectURL(answerSheetUrl)
    setAnswerSheetUrl(null)
    setExtractedData(null)
    setSelectedQuestionId(null)
    setError(null)
  }, [answerSheetUrl])

  if (!extractedData) {
    return (
      <div className="min-h-screen bg-muted/40">
        <header className="flex h-[72px] items-center justify-between border-b border-border bg-card px-5 md:px-8">
          <Logo />
          <div className="flex items-center gap-3 text-muted-foreground">
            <Search className="hidden size-5 md:block" />
            <Bell className="size-5" />
            <div className="grid size-8 place-items-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
              T
            </div>
          </div>
        </header>
        <FileUploader
          questionPaper={questionPaper}
          answerSheet={answerSheet}
          isProcessing={isProcessing}
          onQuestionPaperChange={setQuestionPaper}
          onAnswerSheetChange={handleAnswerSheetChange}
          onStart={handleStart}
        />
        {error && (
          <div className="mx-auto max-w-[850px] px-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Extraction failed</p>
              <p className="mt-1">{error}</p>
              <button onClick={() => setError(null)} className="mt-2 text-xs underline">
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="flex min-h-screen">
        <Sidebar mobileOpen={mobileMenu} onClose={() => setMobileMenu(false)} />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur md:px-7">
            <div className="flex items-center gap-3">
              <button
                className="rounded-lg p-2 lg:hidden"
                onClick={() => setMobileMenu(true)}
                aria-label="Open menu"
              >
                <Menu />
              </button>
              <ChevronLeft className="hidden size-5 text-muted-foreground md:block" />
              <button
                onClick={handleReset}
                className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:block"
              >
                ← New upload
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="relative rounded-full p-2 text-muted-foreground"
                aria-label="Notifications"
              >
                <Bell className="size-5" />
                <span className="absolute right-2 top-1 size-1.5 rounded-full bg-orange-500" />
              </button>
              <div className="grid size-8 place-items-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                T
              </div>
              <span className="hidden text-sm font-semibold md:block">Teacher</span>
              <ChevronDown className="hidden size-4 md:block" />
            </div>
          </header>
          <main className="p-4 md:p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
                AI assessment
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                Review answers
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {extractedData.questions.length} questions extracted &middot;{' '}
                {extractedData.totalAnswerPages} answer page
                {extractedData.totalAnswerPages > 1 ? 's' : ''}
              </p>
            </div>
            <div className="grid gap-4 xl:grid-cols-[minmax(330px,1fr)_minmax(480px,1.5fr)]">
              <QuestionsSidebar
                data={extractedData}
                selectedQuestionId={selectedQuestionId}
                onSelectQuestion={setSelectedQuestionId}
              />
              {answerSheetUrl && (
                <DocumentWorkspace
                  answerSheetUrl={answerSheetUrl}
                  answerSheetType={answerSheet?.type ?? 'application/pdf'}
                  data={extractedData}
                  selectedQuestionId={selectedQuestionId}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
