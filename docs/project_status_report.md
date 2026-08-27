# VedaAI Project Status Report — Full Roadmap Audit

## Roadmap Phase Status

| Phase | Status | Notes |
|---|---|---|
| **Phase 0 — Setup** | ✅ Done | Next.js + TS + Tailwind scaffolded. GitHub repo pushed (`tsvlgd/veda-ai-assessment-grading`). Gemini + Groq API keys configured in `.env`. |
| **Phase 1 — Upload & File Handling** | ✅ Done | Two file inputs (PDF/image). Client-side preview. **pdfjs-dist** now renders PDF pages to canvas-backed images per ADR-01. |
| **Phase 2 — Extraction Pipeline** | ✅ Done | Single structured prompt → `gemini-3.6-flash`. Zod validation (`ExtractionResultSchema`). Groq fallback (`llama-3.3-70b-versatile` + `pdf-parse` text extraction). Regex JSON cleanup from AI output. |
| **Phase 3 — Mapping Refinement** | ✅ Done | Model's direct number-label match used. Confidence scores preserved. Unmatched answers bucketed with `questionId: null`. |
| **Phase 4 — Two-Pane Viewer + Highlighting** | ✅ Done (major rewrite) | Custom `pdfjs-dist` page-by-page renderer replaces broken `<iframe>`/`<object>` approach. SVG overlays with `viewBox="0 0 100 100"` for percentage-accurate bounding boxes. Auto-scroll to highlighted region. |
| **Phase 5 — Edge Cases** | ✅ Done | Unanswered questions shown as gray "Unanswered" state. Unmatched answers shown in amber section. Multi-page coordinates supported. Out-of-order matching by question number. |
| **Phase 6 — Deploy + Submission** | 🔲 Pending | Vercel deploy not yet done. README needs final write-up. |

---

## ADR Implementation Audit

| ADR | Decision | Status | Implementation |
|---|---|---|---|
| **ADR-01** | Treat display & AI consumers differently — render PDF to `<img>` via pdfjs-dist | ✅ Implemented | `lib/pdf-renderer.ts` — client-side canvas rendering, blob URL output |
| **ADR-02** | Server Actions over API Routes, 15MB limit | ✅ Implemented | `app/actions.ts` uses `'use server'`, `next.config.mjs` has `serverActions.bodySizeLimit: '15mb'` |
| **ADR-03** | Plain React `useState` | ✅ Implemented | All state in `page.tsx`: `extractedData`, `selectedQuestionId`, `renderedPages` |
| **ADR-04** | Shared Zod schema contract | ✅ Implemented | `lib/schemas.ts` — `BoundingBoxSchema`, `QuestionSchema`, `AnswerMappingSchema`, `ExtractionResultSchema` |
| **ADR-05** | No persistence — ephemeral by design | ✅ Implemented | Files in browser `Blob` memory, streamed per-request, `URL.revokeObjectURL` on reset |
| **ADR-06** | Existing UI is reference, not final | ✅ Implemented | Refactored into: `file-uploader.tsx`, `questions-sidebar.tsx`, `document-workspace.tsx`, `page.tsx` |

---

## Architecture Flow (What's Actually Running)

```
┌──────────────────────────────────────────────────────────────────┐
│ TEACHER UPLOADS 2 FILES                                         │
│ ┌─────────────────────┐  ┌──────────────────────────────┐       │
│ │ QuestionPaper.pdf    │  │ HandwrittenAnswerSheet.pdf   │       │
│ └─────────┬───────────┘  └──────────────┬───────────────┘       │
│           │                              │                       │
│     ┌─────┴──────┐               ┌──────┴────────┐              │
│     │ ANALYTICAL │               │ DISPLAY       │              │
│     │ BRANCH     │               │ BRANCH        │              │
│     │            │               │               │              │
│     │ FormData → │               │ pdfjs-dist    │              │
│     │ Server     │               │ canvas render │              │
│     │ Action     │               │ → blob URLs   │              │
│     └─────┬──────┘               └──────┬────────┘              │
│           │                              │                       │
│     ┌─────┴──────────┐          ┌───────┴─────────┐             │
│     │ Gemini 3.6     │          │ renderedPages[] │             │
│     │ Flash (primary)│          │ string[]        │             │
│     │ Groq (fallback)│          └───────┬─────────┘             │
│     └─────┬──────────┘                  │                       │
│           │                              │                       │
│     ┌─────┴──────────┐                  │                       │
│     │ JSON.parse →   │                  │                       │
│     │ Zod validate   │                  │                       │
│     └─────┬──────────┘                  │                       │
│           │                              │                       │
│     ┌─────┴──────────────────────────────┴──────────┐           │
│     │ React useState Hub (page.tsx)                  │           │
│     │ extractedData | selectedQuestionId | pages     │           │
│     └──────┬──────────────────────────┬──────────────┘          │
│            │                          │                          │
│     ┌──────┴──────────┐      ┌───────┴───────────────┐          │
│     │ QuestionsSidebar│      │ DocumentWorkspace     │          │
│     │ Left panel      │      │ Right panel           │          │
│     │ Click → setId() │      │ Per-page <img> +      │          │
│     │                 │      │ SVG overlay rects     │          │
│     └─────────────────┘      └───────────────────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Bugs Fixed During This Session

### 1. Gemini 503/404 Model Errors
- **Root cause**: `gemini-2.5-flash` deprecated, `gemini-1.5-pro` not available in v1beta
- **Fix**: Updated to `gemini-3.6-flash` (the environment's required model)
- **Added**: Groq fallback pipeline with `llama-3.3-70b-versatile` + `pdf-parse` text extraction

### 2. `pdf-parse` Import Crash ("is not a function")
- **Root cause**: Next.js Turbopack ESM/CJS interop breaks default imports from CommonJS modules
- **Fix**: Resilient import with runtime resolution: `typeof pdfParse === 'function' ? pdfParse : (pdfParse as any).default`

### 3. Answer Sheet PDF Black Screen
- **Root cause**: `<object type="application/pdf">` with `pointer-events-none` and absurd `minHeight: ${totalPages * 800}px` crashed the native PDF renderer
- **Fix**: Replaced entirely with custom `pdfjs-dist` page-by-page canvas renderer per ADR-01

### 4. SVG Bounding Box Misalignment
- **Root cause**: Absolute SVG overlay on top of native PDF widget can never align because the widget manages its own internal scroll/zoom
- **Fix**: Each page is now a standalone `<img>` with its own `<svg viewBox="0 0 100 100">` overlay — percentage coordinates map 1:1

### 5. Global Scroll Bug (Sidebar Disappearing)
- **Root cause**: No `overflow-hidden` on root, scrolling questions scrolled the entire window
- **Fix**: Root layout `h-screen overflow-hidden`, `main` is `flex-1 flex-col overflow-hidden`, grid children use `min-h-0 flex-1`

### 6. Home Page Scroll at 100% Zoom
- **Root cause**: `min-h-[calc(100vh-72px)]` + large icon (size-20) + big heading (text-6xl) + generous padding (py-10, mt-10) pushed content below fold
- **Fix**: Changed to `h-[calc(100vh-72px)] overflow-hidden`, reduced icon to size-14, heading to text-5xl, tightened all margins

### 7. Git Push Authentication
- **Root cause**: `~/.git-credentials` had `so-glitchh` credentials cached
- **Fix**: Guided user to clear stored credentials and re-authenticate as `tsvlgd`

---

## File Manifest (What Changed)

| File | What Changed |
|---|---|
| `app/actions.ts` | Model → `gemini-3.6-flash`, 60s timeout, Groq fallback pipeline, `pdf-parse` import fix |
| `app/page.tsx` | `renderedPages` state, `renderPdfToImages` wiring, `h-screen overflow-hidden` layout, flex column main |
| `components/document-workspace.tsx` | Full rewrite: per-page `<img>` + SVG overlay with `viewBox`, auto-scroll, page number badges |
| `components/file-uploader.tsx` | Tightened spacing for 100% zoom fit |
| `components/questions-sidebar.tsx` | Removed fixed `min-h-[650px]`, now `min-h-0 flex-1` |
| `lib/pdf-renderer.ts` | **New file** — pdfjs-dist canvas rendering pipeline |
| `lib/schemas.ts` | No changes needed — schema was already correct |
| `.gitignore` | Added `.env` to prevent secret leakage |
| `README.md` | Created with repo title |

---

## Remaining Work

### Phase 6 — Deploy + Submission
1. Vercel deploy
2. Final README write-up (approach, model used, assumptions, limitations)
3. End-to-end live URL test

### Optional Polish
- Figma pixel-matching (requires authenticated Figma access)
- Mobile responsiveness testing
- Grading/feedback scoring (explicitly optional per roadmap)
