'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
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
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const containerRef = useRef<HTMLDivElement>(null)
  const totalPages = renderedPages.length

  const activeCoordinates = useMemo(() => {
    if (!selectedQuestionId) return []
    const mapping = data.mappings.find((m) => m.questionId === selectedQuestionId)
    return mapping?.coordinates ?? []
  }, [data.mappings, selectedQuestionId])

  const activeLabel = useMemo(() => {
    if (!selectedQuestionId) return ''
    return data.questions.find((q) => q.id === selectedQuestionId)?.label ?? ''
  }, [data.questions, selectedQuestionId])

  // Navigate to the page of the selected question's answer
  useEffect(() => {
    if (activeCoordinates.length > 0) {
      setCurrentPage(activeCoordinates[0].page)
    }
  }, [activeCoordinates])

  const coordsForCurrentPage = useMemo(() => {
    return activeCoordinates.filter((c) => c.page === currentPage)
  }, [activeCoordinates, currentPage])

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1))
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1))
  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 25))
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 25))

  const pageUrl = renderedPages[currentPage - 1]

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-foreground/95 px-4 py-2.5 text-white">
        {/* Zoom controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="grid size-7 place-items-center rounded-md transition hover:bg-white/10 disabled:opacity-40"
            aria-label="Zoom out"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="min-w-[48px] text-center text-xs font-semibold">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="grid size-7 place-items-center rounded-md transition hover:bg-white/10 disabled:opacity-40"
            aria-label="Zoom in"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentPage <= 1}
            className="grid size-7 place-items-center rounded-md transition hover:bg-white/10 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-xs font-semibold">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage >= totalPages}
            className="grid size-7 place-items-center rounded-md transition hover:bg-white/10 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Page viewer */}
      <div ref={containerRef} className="custom-scrollbar flex-1 overflow-auto bg-muted/30 p-4">
        <div
          className="relative mx-auto overflow-hidden rounded-lg border border-border shadow-sm transition-transform origin-top"
          style={{ width: `${zoom}%`, maxWidth: `${zoom}%` }}
        >
          {pageUrl && (
            <img
              src={pageUrl}
              alt={`Answer sheet page ${currentPage}`}
              className="block w-full"
              draggable={false}
            />
          )}
          {/* Green highlight boxes for matched answers */}
          {coordsForCurrentPage.length > 0 && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {coordsForCurrentPage.map((box, i) => (
                <g key={i}>
                  <rect
                    x={box.xmin}
                    y={box.ymin}
                    width={box.xmax - box.xmin}
                    height={box.ymax - box.ymin}
                    fill="rgba(34, 197, 94, 0.08)"
                    stroke="rgb(34, 197, 94)"
                    strokeWidth="0.5"
                    rx="0.3"
                  />
                  {/* Green label badge */}
                  <rect
                    x={box.xmin}
                    y={box.ymin - 3}
                    width="8"
                    height="3"
                    fill="rgb(34, 197, 94)"
                    rx="0.5"
                  />
                  <text
                    x={box.xmin + 1}
                    y={box.ymin - 0.8}
                    fill="white"
                    fontSize="2"
                    fontWeight="bold"
                  >
                    Q{activeLabel}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </div>
      </div>
    </section>
  )
}
