'use client'

import { useEffect, useRef, useMemo } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import type { ExtractionResult, BoundingBox } from '@/lib/schemas'

interface DocumentWorkspaceProps {
  renderedPages: string[]
  data: ExtractionResult
  selectedQuestionId: string | null
}

export default function DocumentWorkspace({
  renderedPages,
  data,
  selectedQuestionId,
}: DocumentWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const totalPages = renderedPages.length

  const activeCoordinates = useMemo(() => {
    if (!selectedQuestionId) return []
    const mapping = data.mappings.find((m) => m.questionId === selectedQuestionId)
    return mapping?.coordinates ?? []
  }, [data.mappings, selectedQuestionId])

  useEffect(() => {
    if (activeCoordinates.length === 0) return
    const first = activeCoordinates[0]
    const pageEl = pageRefs.current.get(first.page)
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeCoordinates])

  const coordsByPage = useMemo(() => {
    const map = new Map<number, BoundingBox[]>()
    for (const box of activeCoordinates) {
      const arr = map.get(box.page) || []
      arr.push(box)
      map.set(box.page, arr)
    }
    return map
  }, [activeCoordinates])

  const activeLabel = useMemo(() => {
    if (!selectedQuestionId) return ''
    return data.questions.find((q) => q.id === selectedQuestionId)?.label ?? ''
  }, [data.questions, selectedQuestionId])

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-foreground px-4 py-3 text-background">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ImageIcon className="size-4" />
          Answer sheet
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-background/60">
            {totalPages} page{totalPages > 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-4">
          {renderedPages.map((pageUrl, idx) => {
            const pageNum = idx + 1
            const boxes = coordsByPage.get(pageNum) || []
            return (
              <div
                key={pageNum}
                ref={(el) => {
                  if (el) pageRefs.current.set(pageNum, el)
                }}
                className="relative w-full overflow-hidden rounded-lg border border-border shadow-sm"
              >
                <img
                  src={pageUrl}
                  alt={`Answer sheet page ${pageNum}`}
                  className="block w-full"
                  draggable={false}
                />
                {boxes.length > 0 && (
                  <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {boxes.map((box, i) => (
                      <g key={i}>
                        <rect
                          x={box.xmin}
                          y={box.ymin}
                          width={box.xmax - box.xmin}
                          height={box.ymax - box.ymin}
                          fill="rgba(251, 146, 60, 0.18)"
                          stroke="rgb(249, 115, 22)"
                          strokeWidth="0.4"
                          rx="0.3"
                        />
                        <text
                          x={box.xmin}
                          y={box.ymin - 0.5}
                          fill="rgb(249, 115, 22)"
                          fontSize="2.5"
                          fontWeight="bold"
                        >
                          Q{activeLabel}
                        </text>
                      </g>
                    ))}
                  </svg>
                )}
                <div className="absolute bottom-2 right-2 rounded-md bg-foreground/80 px-2 py-0.5 text-[10px] font-bold text-background">
                  Page {pageNum}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
