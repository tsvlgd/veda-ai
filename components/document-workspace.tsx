'use client'

import { useEffect, useRef, useMemo } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import type { ExtractionResult, BoundingBox } from '@/lib/schemas'

interface DocumentWorkspaceProps {
  answerSheetUrl: string
  answerSheetType: string
  data: ExtractionResult
  selectedQuestionId: string | null
}

function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export default function DocumentWorkspace({
  answerSheetUrl,
  answerSheetType,
  data,
  selectedQuestionId,
}: DocumentWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const totalPages = data.totalAnswerPages
  const isImage = isImageType(answerSheetType)

  const activeCoordinates = useMemo(() => {
    if (!selectedQuestionId) return []
    const mapping = data.mappings.find((m) => m.questionId === selectedQuestionId)
    return mapping?.coordinates ?? []
  }, [data.mappings, selectedQuestionId])

  useEffect(() => {
    if (activeCoordinates.length === 0 || !containerRef.current) return

    const first = activeCoordinates[0]
    const container = containerRef.current
    const innerHeight = container.scrollHeight

    if (isImage) {
      const scrollTarget = (first.ymin / 100) * innerHeight
      container.scrollTo({ top: scrollTarget - 60, behavior: 'smooth' })
    } else {
      const pageOffset = ((first.page - 1) / totalPages) * innerHeight
      const withinPage = (first.ymin / 100) * (innerHeight / totalPages)
      container.scrollTo({ top: pageOffset + withinPage - 60, behavior: 'smooth' })
    }
  }, [activeCoordinates, isImage, totalPages])

  function computeSvgRect(box: BoundingBox) {
    if (isImage) {
      return {
        x: `${box.xmin}%`,
        y: `${box.ymin}%`,
        width: `${box.xmax - box.xmin}%`,
        height: `${box.ymax - box.ymin}%`,
      }
    }
    const pageHeight = 100 / totalPages
    const yOffset = (box.page - 1) * pageHeight
    return {
      x: `${box.xmin}%`,
      y: `${yOffset + (box.ymin / 100) * pageHeight}%`,
      width: `${box.xmax - box.xmin}%`,
      height: `${((box.ymax - box.ymin) / 100) * pageHeight}%`,
    }
  }

  const contentHeight = isImage ? 'auto' : `${totalPages * 100}%`

  return (
    <section className="flex min-h-[650px] flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-foreground px-4 py-3 text-background">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ImageIcon className="size-4" />
          Answer sheet
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-background/60">
            {isImage ? '1 page' : `${totalPages} page${totalPages > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>
      <div ref={containerRef} className="relative flex-1 overflow-y-auto p-3">
        <div className="relative w-full" style={{ height: contentHeight }}>
          {isImage ? (
            <img
              src={answerSheetUrl}
              alt="Answer sheet"
              className="w-full"
              draggable={false}
            />
          ) : (
            <object
              data={`${answerSheetUrl}#toolbar=0&navpanes=0`}
              type="application/pdf"
              className="pointer-events-none w-full"
              style={{ height: `${totalPages * 100}%`, minHeight: `${totalPages * 800}px` }}
            >
              <p className="p-8 text-center text-sm text-muted-foreground">
                PDF preview not available.{' '}
                <a href={answerSheetUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  Download the answer sheet
                </a>
              </p>
            </object>
          )}
          <svg
            className="pointer-events-none absolute left-0 top-0 h-full w-full"
            preserveAspectRatio="none"
          >
            {activeCoordinates.map((box, i) => {
              const rect = computeSvgRect(box)
              return (
                <g key={i}>
                  <rect
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    fill="rgba(251, 146, 60, 0.15)"
                    stroke="rgb(249, 115, 22)"
                    strokeWidth="2"
                    rx="4"
                  />
                  <text
                    x={rect.x}
                    y={rect.y}
                    dy="-6"
                    fill="rgb(249, 115, 22)"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {selectedQuestionId
                      ? data.questions.find((q) => q.id === selectedQuestionId)?.label ?? ''
                      : ''}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </section>
  )
}
