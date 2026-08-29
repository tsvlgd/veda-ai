'use client'

import { useRef } from 'react'
import { ArrowRight, FileText, Upload, X } from 'lucide-react'

interface FileUploaderProps {
  questionPaper: File | null
  answerSheet: File | null
  isProcessing: boolean
  onQuestionPaperChange: (file: File | null) => void
  onAnswerSheetChange: (file: File | null) => void
  onStart: () => void
}

function PdfIcon() {
  return (
    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-red-100">
      <span className="text-[10px] font-black tracking-tight text-red-600">PDF</span>
    </div>
  )
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
    <div className="flex min-h-[140px] flex-1 flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#e5e5e5] bg-white p-5 text-center shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] md:min-h-[160px]">
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
        <div className="relative flex items-center gap-3 rounded-2xl bg-gray-100 px-5 py-3.5">
          <button
            onClick={() => onFile(null)}
            disabled={disabled}
            className="absolute -right-2.5 -top-2.5 grid size-7 place-items-center rounded-full bg-[#555555] text-white shadow-sm transition hover:bg-[#333333]"
            aria-label={`Remove ${type}`}
          >
            <X className="size-4" />
          </button>
          <PdfIcon />
          <div className="text-left">
            <p className="max-w-[180px] truncate text-sm font-bold text-foreground">{file.name}</p>
            <p className="text-xs font-medium text-muted-foreground">
              {(file.size / (1024 * 1024)).toFixed(0)}MB &middot;{' '}
              {file.type.includes('pdf') ? 'PDF' : 'Image'}
            </p>
          </div>
        </div>
      ) : (
        <button
          className="flex flex-col items-center gap-3 transition hover:opacity-80"
          onClick={() => ref.current?.click()}
          disabled={disabled}
        >
          <div className="grid size-12 place-items-center rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
            <Upload className="size-5 text-gray-500" />
          </div>
          <span className="text-sm font-bold text-foreground">
            Upload <span className="text-orange-600">{type}</span>
          </span>
          <span className="text-xs font-medium text-muted-foreground">Max 10MB</span>
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
  const bothUploaded = !!questionPaper && !!answerSheet

  return (
    <div className="flex-1 overflow-auto px-4 py-4 md:py-6">
      <div className="mx-auto flex min-h-full w-full max-w-[850px] flex-col items-center justify-center text-center">
        <h1 className="text-balance text-3xl font-bold tracking-tight md:text-[2.5rem] md:leading-tight">
          Upload{' '}
          <span className="rounded-lg bg-orange-100 px-2.5 py-0.5 text-orange-600">
            Question Paper &amp; Answer Sheets
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload both files to get started
        </p>

        {/* Teacher illustration */}
        <div className="mx-auto mt-4 mb-4 flex justify-center">
          <img
            src="/teacher-illustration.png"
            alt="Teacher illustration"
            className="h-[145px] w-auto object-contain mix-blend-multiply md:h-[250px]"
            draggable={false}
          />
        </div>

        {/* Upload boxes */}
        <div className="mx-auto flex w-full max-w-[800px] flex-col gap-4 md:flex-row md:gap-6">
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

        {/* Start Mapping button */}
        <button
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#313131] px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#222222] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!bothUploaded || isProcessing}
          onClick={onStart}
        >
          Start Mapping
          <ArrowRight className="size-4" />
        </button>

        <p className="mt-3 text-xs text-muted-foreground">
          Once both files are uploaded, you&apos;ll able to map answers with questions
        </p>
      </div>
    </div>
  )
}
