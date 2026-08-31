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
  FileText,
  HelpCircle,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  Users,
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
  { label: 'My Classroom', icon: Users },
  { label: 'Assignments', icon: FileText },
  { label: 'Exams', icon: ClipboardList },
  { label: 'My Library', icon: BookOpen },
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
        className={`fixed inset-y-0 left-0 z-40 flex ${w} shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] transition-all duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center ${collapsed ? 'flex-col gap-3 pt-5' : 'justify-between p-4'}`}>
          <Logo compact={collapsed} />
          {!collapsed && (
            <div className="flex items-center gap-1">
              {/* Collapse toggle (desktop only) */}
              <button
                onClick={onToggleCollapse}
                className="hidden items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:flex transition"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="size-5" />
              </button>
              {/* Close toggle (mobile only) */}
              <button
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
                onClick={onClose}
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
          )}
          {collapsed && (
            <button
               onClick={onToggleCollapse}
               className="hidden items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:flex transition"
               aria-label="Expand sidebar"
             >
               <PanelLeftOpen className="size-5" />
            </button>
          )}
        </div>

        {/* AI Teacher's Toolkit */}
        {collapsed ? (
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-foreground shadow-[0_0_0_3px_rgba(251,146,60,0.3)]">
            <Sparkles className="size-4 text-orange-400" />
          </div>
        ) : (
          <div className="mx-3 flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-background shadow-[0_0_0_3px_rgba(251,146,60,0.3)]">
            <Sparkles className="size-4 shrink-0 text-orange-400" />
            <span className="text-sm font-semibold">AI Teacher&apos;s Toolkit</span>
          </div>
        )}

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
    <header className="flex h-[60px] shrink-0 items-center justify-between rounded-2xl bg-white px-4 shadow-[0_2px_12px_rgba(0,0,0,0.07)] md:px-5">

      {/* ── LEFT ── */}
      <div className="flex items-center gap-3">
        {/* Mobile: optional back arrow */}
        {showBackButton && (
          <button onClick={onReset} className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition lg:hidden">
            <ChevronLeft className="size-5" />
          </button>
        )}
        {/* Mobile: VedaAI brand */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="grid size-8 place-items-center rounded-xl bg-slate-900">
            <span className="text-sm font-black text-white">V</span>
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">VedaAI</span>
        </div>
        {/* Desktop: back arrow + Exams breadcrumb */}
        <div className="hidden items-center gap-2 lg:flex">
          {showBackButton && (
            <button onClick={onReset} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition">
              <ChevronLeft className="size-4" />
            </button>
          )}
          <div className="flex items-center gap-2 text-sm">
            <ClipboardList className="size-4 text-muted-foreground" />
            <span className="font-medium text-foreground">Exams</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className="flex items-center gap-3">
        {/* Desktop-only icons */}
        <button className="hidden rounded-full p-2 text-muted-foreground hover:bg-muted lg:grid" aria-label="Help">
          <HelpCircle className="size-5" />
        </button>
        {/* Bell — always visible */}
        <button className="relative text-muted-foreground hover:text-slate-900 transition" aria-label="Notifications">
          <Bell className="size-5" />
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-orange-500" />
        </button>
        <button className="hidden rounded-full p-2 text-muted-foreground hover:bg-muted lg:grid" aria-label="AI Sparkle">
          <Sparkles className="size-5" />
        </button>
        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center overflow-hidden rounded-full bg-slate-200">
            <img src="/placeholder-user.jpg" alt="User avatar" className="size-full object-cover" />
          </div>
          <span className="hidden text-sm font-semibold lg:block">Madhur Rastogi</span>
          <ChevronDown className="hidden size-4 text-muted-foreground lg:block" />
        </div>
        {/* Mobile-only: hamburger on the RIGHT */}
        <button
          className="text-muted-foreground hover:text-slate-900 transition lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </button>
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
    <div className="flex gap-1 rounded-full bg-zinc-100 p-1 shadow-inner">
      <button
        onClick={() => onTabChange('questions')}
        className={`flex-1 rounded-full px-5 py-2 text-sm font-semibold transition ${
          activeTab === 'questions'
            ? 'bg-zinc-900 text-white shadow-md'
            : 'text-zinc-500 hover:text-zinc-700'
        }`}
      >
        Questions
      </button>
      <button
        onClick={() => onTabChange('answers')}
        className={`flex-1 rounded-full px-5 py-2 text-sm font-semibold transition ${
          activeTab === 'answers'
            ? 'bg-zinc-900 text-white shadow-md'
            : 'text-zinc-500 hover:text-zinc-700'
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
    <div className="flex h-screen gap-3 overflow-hidden bg-[#f4f4f5] px-4 py-3">
      {/* Sidebar — always present */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenu}
        onClose={() => setMobileMenu(false)}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden">
        <Navbar
          onMenuClick={() => setMobileMenu(true)}
          onReset={handleReset}
          showBackButton={appState !== 'upload'}
        />

        {/* Content area */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#F2F2F2]">
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
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
              {/* Mobile tab nav — hidden on desktop */}
              <div className="lg:hidden">
                <MobileTabNav activeTab={mobileTab} onTabChange={setMobileTab} />
              </div>

              {/* Desktop: side-by-side. Mobile: tab-switched */}
              <div className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[minmax(330px,1fr)_minmax(480px,1.5fr)]">
                {/* Questions panel */}
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
