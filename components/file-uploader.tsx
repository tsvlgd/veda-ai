'use client'

import { useRef } from 'react'
import { ChevronRight, FileText, Sparkles, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileUploaderProps {
  questionPaper: File | null
  answerSheet: File | null
  isProcessing: boolean
  onQuestionPaperChange: (file: File | null) => void
  onAnswerSheetChange: (file: File | null) => void
  onStart: () => void
}

function UploadCard({
  type,
  file,
  onFile,
  disabled,
}: {
  type: string
  file: File | null
  onFile: (file: File | null) => void
  disabled: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div className="flex min-h-[154px] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background p-4 text-center">
      <input
        ref={ref}
        type="file"
        className="hidden"
        accept=".pdf,image/*"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
      {file ? (
        <div className="relative rounded-xl bg-muted px-5 py-3 text-left">
          <button
            onClick={() => onFile(null)}
            disabled={disabled}
            className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-foreground text-background"
            aria-label={`Remove ${type}`}
          >
            <X className="size-3" />
          </button>
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-lg bg-orange-100 text-orange-600">
              <FileText className="size-4" />
            </div>
            <div>
              <p className="max-w-[190px] truncate text-sm font-semibold">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {file.type.includes('pdf') ? 'PDF' : 'Image'} &middot; Ready to analyze
              </p>
            </div>
          </div>
        </div>
      ) : (
        <button
          className="flex flex-col items-center gap-3"
          onClick={() => ref.current?.click()}
          disabled={disabled}
        >
          <div className="grid size-11 place-items-center rounded-xl bg-muted">
            <Upload className="size-5" />
          </div>
          <span className="text-sm font-semibold">
            Upload <span className="text-orange-600">{type}</span>
          </span>
          <span className="text-xs text-muted-foreground">PDF or image &middot; Max 15MB</span>
        </button>
      )}
    </div>
  )
}

export default function FileUploader({
  questionPaper,
  answerSheet,
  isProcessing,
  onQuestionPaperChange,
  onAnswerSheetChange,
  onStart,
}: FileUploaderProps) {
  return (
    <div className="flex h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-4">
      <div className="w-full max-w-[850px] text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full border-[6px] border-orange-100 bg-orange-50 text-orange-500">
          <Sparkles className="size-6" />
        </div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
          New grading workspace
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
          Upload{' '}
          <span className="rounded-lg bg-orange-100 px-2 text-orange-600">question paper</span>
          <br className="hidden md:block" /> &amp; answer sheet
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload both files to extract questions and map answers automatically.
        </p>

        <div className="mt-6 flex flex-col gap-3 rounded-3xl bg-muted/70 p-3 md:flex-row md:p-4">
          <UploadCard
            type="Question Paper"
            file={questionPaper}
            onFile={onQuestionPaperChange}
            disabled={isProcessing}
          />
          <UploadCard
            type="Answer Sheet"
            file={answerSheet}
            onFile={onAnswerSheetChange}
            disabled={isProcessing}
          />
        </div>

        <Button
          size="lg"
          className="mt-5 rounded-full px-7"
          disabled={!questionPaper || !answerSheet || isProcessing}
          onClick={onStart}
        >
          {isProcessing ? (
            <>
              <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Analyzing with AI&hellip;
            </>
          ) : (
            <>
              Start grading <ChevronRight data-icon="inline-end" />
            </>
          )}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Your files stay private and are only used for this grading session.
        </p>
      </div>
    </div>
  )
}
