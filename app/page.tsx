'use client'

import { useState, useCallback } from 'react'
import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ClipboardList,
  Clock,
  FileText,
  Grid2X2,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Settings,
  Sparkles,
  Star,
  X,
} from 'lucide-react'

import type { ExtractionResult } from '@/lib/schemas'
import { renderPdfToImages } from '@/lib/pdf-renderer'
import FileUploader from '@/components/file-uploader'
import ExtractingScreen from '@/components/extracting-screen'
import QuestionsSidebar from '@/components/questions-sidebar'
import DocumentWorkspace from '@/components/document-workspace'

type AppState = 'upload' | 'extracting' | 'results'

/* ─── Logo ─── */
function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid size-9 place-items-center rounded-xl bg-foreground text-background">
        <span className="text-lg font-black">V</span>
      </div>
      {!compact && <span className="text-xl font-bold tracking-tight">VedaAI</span>}
    </div>
  )
}

/* ─── Sidebar ─── */
const NAV_ITEMS = [
  { label: 'Home', icon: LayoutDashboard },
  { label: 'My Classroom', icon: Grid2X2 },
  { label: 'Assignments', icon: ClipboardList },
  { label: 'Exams', icon: BookOpen },
  { label: 'My Library', icon: Clock },
] as const

function Sidebar({
  collapsed,
  mobileOpen,
  onClose,
  onToggleCollapse,
}: {
  collapsed: boolean
  mobileOpen: boolean
  onClose: () => void
  onToggleCollapse: () => void
}) {
  const w = collapsed ? 'w-[68px]' : 'w-[238px]'

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex ${w} flex-col border-r border-border bg-card transition-all duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-4`}>
          <Logo compact={collapsed} />
          {!collapsed && (
            <button
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* AI Teacher's Toolkit */}
        <div className={`mx-3 rounded-2xl bg-foreground ${collapsed ? 'p-2' : 'p-3'} text-background`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'} font-semibold`}>
            <Sparkles className="size-4 shrink-0 text-orange-400" />
            {!collapsed && <span className="text-sm">AI Teacher&apos;s Toolkit</span>}
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-6 flex flex-col gap-0.5 px-2 text-sm">
          {NAV_ITEMS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} rounded-xl px-3 py-2.5 text-left transition ${
                label === 'Exams'
                  ? 'bg-muted font-semibold text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon className="size-[18px] shrink-0" />
              {!collapsed && label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="mt-auto flex flex-col gap-4 p-3">
          {!collapsed && (
            <button className="flex items-center gap-3 px-3 text-sm text-muted-foreground hover:text-foreground transition">
              <Settings className="size-[18px]" /> Settings
            </button>
          )}
          {collapsed && (
            <button className="flex justify-center text-muted-foreground" title="Settings">
              <Settings className="size-[18px]" />
            </button>
          )}

          {/* School card */}
          <div className={`rounded-2xl bg-muted ${collapsed ? 'p-2' : 'p-3'}`}>
            {collapsed ? (
              <div className="flex justify-center">
                <div className="size-7 rounded-full bg-green-100 grid place-items-center">
                  <span className="text-[9px] font-bold text-green-800">DPS</span>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold">Delhi Public School</p>
                <p className="text-xs text-muted-foreground">Bokaro Steel City</p>
              </>
            )}
          </div>

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={onToggleCollapse}
            className="hidden items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted lg:flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronsRight className={`size-4 transition ${collapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </aside>
    </>
  )
}

/* ─── Top Navbar ─── */
function Navbar({
  onMenuClick,
  onReset,
  showBackButton,
}: {
  onMenuClick: () => void
  onReset: () => void
  showBackButton: boolean
}) {
  return (
    <header className="sticky top-0 z-20 flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          className="rounded-lg p-2 text-muted-foreground lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        {showBackButton && (
          <button onClick={onReset} className="text-muted-foreground hover:text-foreground transition">
            <ChevronLeft className="size-5" />
          </button>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="size-4" />
          <span className="font-medium">Exams</span>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <button className="hidden rounded-full p-2 text-muted-foreground hover:bg-muted md:grid" aria-label="Help">
          <HelpCircle className="size-5" />
        </button>
        <button className="relative rounded-full p-2 text-muted-foreground hover:bg-muted" aria-label="Notifications">
          <Bell className="size-5" />
          <span className="absolute right-2 top-1.5 size-2 rounded-full bg-orange-500" />
        </button>
        <button className="hidden rounded-full p-2 text-muted-foreground hover:bg-muted md:grid" aria-label="Starred">
          <Star className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-full bg-foreground">
            <img
              src="/placeholder-user.jpg"
              alt="User avatar"
              className="size-8 rounded-full object-cover"
            />
          </div>
          <span className="hidden text-sm font-semibold md:block">Madhur Rastogi</span>
          <ChevronDown className="hidden size-4 text-muted-foreground md:block" />
        </div>
      </div>
    </header>
  )
}

/* ─── Mobile Tab Nav (results only) ─── */
function MobileTabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: 'questions' | 'answers'
  onTabChange: (tab: 'questions' | 'answers') => void
}) {
  return (
    <div className="flex gap-1 rounded-full bg-muted p-1 lg:hidden">
      <button
        onClick={() => onTabChange('questions')}
        className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
          activeTab === 'questions'
            ? 'bg-foreground text-white shadow-sm'
            : 'text-muted-foreground'
        }`}
      >
        Questions
      </button>
      <button
        onClick={() => onTabChange('answers')}
        className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
          activeTab === 'answers'
            ? 'bg-foreground text-white shadow-sm'
            : 'text-muted-foreground'
        }`}
      >
        Answer Sheet
      </button>
    </div>
  )
}

/* ─── Main Page ─── */
export default function Page() {
  const [questionPaper, setQuestionPaper] = useState<File | null>(null)
  const [answerSheet, setAnswerSheet] = useState<File | null>(null)
  const [renderedPages, setRenderedPages] = useState<string[]>([])
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [appState, setAppState] = useState<AppState>('upload')
  const [error, setError] = useState<string | null>(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileTab, setMobileTab] = useState<'questions' | 'answers'>('questions')

  const handleAnswerSheetChange = useCallback(
    async (file: File | null) => {
      setAnswerSheet(file)
      renderedPages.forEach((u) => URL.revokeObjectURL(u))
      if (file) {
        const isPdf = file.type === 'application/pdf'
        if (isPdf) {
          const pages = await renderPdfToImages(file)
          setRenderedPages(pages)
        } else {
          setRenderedPages([URL.createObjectURL(file)])
        }
      } else {
        setRenderedPages([])
      }
    },
    [renderedPages],
  )

  const handleStart = useCallback(async () => {
    if (!questionPaper || !answerSheet) return
    setAppState('extracting')
    setSidebarCollapsed(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('questionPaper', questionPaper)
      formData.append('answerSheet', answerSheet)

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setExtractedData(result.data)
        if (result.data.questions.length > 0) {
          setSelectedQuestionId(result.data.questions[0].id)
        }
        setAppState('results')
      } else {
        setError(result.error)
        setAppState('upload')
        setSidebarCollapsed(false)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Server connection failed. Please retry.'
      setError(msg)
      setAppState('upload')
      setSidebarCollapsed(false)
    }
  }, [questionPaper, answerSheet])

  const handleReset = useCallback(() => {
    setQuestionPaper(null)
    setAnswerSheet(null)
    renderedPages.forEach((u) => URL.revokeObjectURL(u))
    setRenderedPages([])
    setExtractedData(null)
    setSelectedQuestionId(null)
    setError(null)
    setAppState('upload')
    setSidebarCollapsed(false)
  }, [renderedPages])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — always present */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenu}
        onClose={() => setMobileMenu(false)}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          onMenuClick={() => setMobileMenu(true)}
          onReset={handleReset}
          showBackButton={appState !== 'upload'}
        />

        {/* Content area */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/40">
          {/* Upload State */}
          {appState === 'upload' && (
            <>
              <FileUploader
                questionPaper={questionPaper}
                answerSheet={answerSheet}
                isProcessing={false}
                onQuestionPaperChange={setQuestionPaper}
                onAnswerSheetChange={handleAnswerSheetChange}
                onStart={handleStart}
              />
              {error && (
                <div className="mx-auto max-w-[850px] px-4 pb-4">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p className="font-semibold">Extraction failed</p>
                    <p className="mt-1">{error}</p>
                    <button onClick={() => setError(null)} className="mt-2 text-xs underline">
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Extracting State */}
          {appState === 'extracting' && <ExtractingScreen />}

          {/* Results State */}
          {appState === 'results' && extractedData && (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 md:p-4">
              {/* Mobile tab nav */}
              <MobileTabNav activeTab={mobileTab} onTabChange={setMobileTab} />

              {/* Desktop: side-by-side. Mobile: tab-switched */}
              <div className="grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[minmax(330px,1fr)_minmax(480px,1.5fr)]">
                {/* Questions panel — always visible on desktop, tab-switched on mobile */}
                <div className={`min-h-0 overflow-hidden ${mobileTab === 'answers' ? 'hidden lg:flex' : 'flex'}`}>
                  <QuestionsSidebar
                    data={extractedData}
                    selectedQuestionId={selectedQuestionId}
                    onSelectQuestion={setSelectedQuestionId}
                  />
                </div>

                {/* Answer sheet — always visible on desktop, tab-switched on mobile */}
                {renderedPages.length > 0 && (
                  <div className={`min-h-0 overflow-hidden ${mobileTab === 'questions' ? 'hidden lg:flex' : 'flex'}`}>
                    <DocumentWorkspace
                      renderedPages={renderedPages}
                      data={extractedData}
                      selectedQuestionId={selectedQuestionId}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
