# VedaAI Technical Architecture

## System Blueprint

The following diagram illustrates the complete data flow from the client upload interface through the AI extraction pipeline and back into the interactive rendering layer.

```text
                      [TEACHER HARD DRIVE / USER INTERFACE]
                                     │
                                     │ (Teacher drops 2 files into WebUI)
                                     ▼
        ┌─────────────────────────────────────────────────────────────┐
        │ FILE UPLOAD LAYER (components/file-uploader.tsx)            │
        ├─────────────────────────────────────────────────────────────┤
        │  [QuestionPaper.pdf]         [HandwrittenAnswerSheet.pdf]   │
        └──────┬───────────────────────────────────────────────┬──────┘
               │                                               │
               │ (Stream raw files via Form Data)              │ (Intercept via client code)
               ▼                                               ▼
┌─────────────────────────────────────────────┐ ┌───────────────────────────────────────────────┐
│ BACKEND PIPELINE (Next.js API Route)        │ │ FRONTEND VIEW RENDERING LAYER                 │
│    File: `app/api/extract/route.ts`         │ │    File: `components/document-workspace.tsx`  │
├─────────────────────────────────────────────┤ ├───────────────────────────────────────────────┤
│ [ADR-02: API Routes over Server Actions]    │ │ [ADR-01: Treat Display & AI Consumers Diff.]  │
│                                             │ │ [ADR-05: Ephemeral Memory - No Databases Used]│
│                                             │ │                                               │
│    Reads streamed multi part file bytes     │ │    Reads raw bytes of Answer Sheet PDF        │
│                    │                        │ │                    │                          │
│                    ▼                        │ │                    ▼                          │
│ MULTI MODAL AI MODEL (Gemini 3.6 Flash)     │ │ Client Engine (`pdfjs-dist` pipeline)         │
│    Context window reads PDF directly.       │ │    Loops over PDF document locally.           │
│    Injects strict JSON schema               │ │    Converts individual pages into browser     │
│    criteria configuration.                  │ │    native, canvas backed images (`<img>`).    │
│                    │                        │ │                    │                          │
│                    ▼                        │ │                    ▼                          │
│ STRING TO JSON TRANSFORM LAYER              │ │ GENERATE EMULATED URL BLOB STRINGS            │
│    AI outputs raw character text string.    │ │    `URL.createObjectURL(pageImageBlob)`       │
│    `JSON.parse(aiOutputString)`             │ │    Outputs: `['blob:1', 'blob:2', 'blob:3']`  │
│                    │                        │ │                    │                          │
│                    ▼                        │ │                    │                          │
│ TYPE CONTRACT CHECKPOINT (Zod Parser)       │ │                    │                          │
│    File: `lib/schemas.ts` [ADR-04 Schema]   │ │                    │                          │
│    Runs: `ExtractionResultSchema.parse()`   │ │                    │                          │
│    Verifies structures & missing targets.   │ │                    │                          │
└────────────────────┬────────────────────────┘ └────────────────────┬────────────────────────┘
                     │                                               │
                     │ (Extracted JSON Data Payload)                 │ (Temporary URL Image Array Link String)
                     ▼                                               ▼
      ┌───────────────────────────────────────────────────────────────────────────────┐
      │ APPLICATION WORKSPACE FRAME (app/page.tsx)                                    │
      ├───────────────────────────────────────────────────────────────────────────────┤
      │ [ADR-03: Unified Local React `useState()` Hooks Manage Current Session State] │
      │                                                                               │
      │   const [extractedData, setExtractedData] = useState<ExtractionResult | null> │
      │   const [selectedQuestionId, setSelectedQuestionId] = useState<string | null> │
      │   const [renderedPages, setRenderedPages] = useState<string[]>                │
      └──────────────────────────────────────┬────────────────────────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │ (State Distribution Waterfall Flows Down) │
                       ▼                                           ▼
┌───────────────────────────────────────────────┐ ┌─────────────────────────────────────────────┐
│ LEFT COLUMN PANEL: QUESTIONS SIDEBAR          │ │ RIGHT COLUMN PANEL: INTERACTIVE VIEW        │
│    File: `components/questions-sidebar.tsx`   │ │    File: `components/document-workspace.tsx`│
├───────────────────────────────────────────────┤ ├─────────────────────────────────────────────┤
│ Loops over `extractedData.questions`.         │ │ Loops over `renderedPages` array.           │
│ Preserves human readable subparts layout      │ │ Sets up responsive parent box structure     │
│ e.g., `11 (a)`, `11 (b)` independently.       │ │ using CSS `position: relative`.             │
│ Detects skipped answers dynamically via code: │ │ Injects backdrop: `<img src={pageUrl} />`   │
│ `!mappings.some(m => m.questionId === q.id)`  │ │ Stacks a transparent canvas on top using    │
│                                               │ │ CSS `position: absolute`.                   │
└──────────────────────┬────────────────────────┘ └──────────────────────┬──────────────────────┘
                       │                                                 │
                       │ (User clicks Question ID Card)                  │ (Listens for global ID update)
                       ▼                                                 ▼
        [ `setSelectedQuestionId("q11_a")` ] ──────────► [ Draws SVG `<rect>` Highlight Shapes ]
                                                            Filters active page targets.
                                                            Computes % coordinates dynamically.
                                                            Triggers programmatic window scroll:
                                                              `element.scrollIntoView()`
```

## Technical Specification & Data Transformation Breakdown

### 1. Phase 1: Upload and Native PDF Injection

The teacher interacts with the DOM elements rendered inside `components/file-uploader.tsx`. Once the file payload triggers a submission event, two separate operations execute in parallel:

*   **The Display Branch:** The raw answer document passes into `pdfjs-dist` on the client tier. It maps individual structural elements into standard, discrete pixel arrays, extracting raw images out of the layout wrapper [ADR-01]. The frontend converts these elements into memory resident string pointers using `URL.createObjectURL()`, setting up a clean image backplate for the application.
*   **The Analytical Branch:** The React application packages files directly inside a standard web native `FormData` container object. It streams them into a Next.js API Route (`app/api/extract/route.ts`), bypassing framework-level CSRF locks [ADR-02].

### 2. Phase 2: Backend AI Extraction Contract

The API Route acts as a thin proxy, passing the multi part file bytes across to Gemini 3.6 Flash. The AI reads the un-split document buffer natively.

We force the AI to return a raw text block matching our exact layout parameters. The text string from the model undergoes parsing via JavaScript's `JSON.parse()`, then feeds straight into the Zod validation checkpoint (`lib/schemas.ts` [ADR-04]).

### 3. Phase 3: Edge Case Data Resolution Math

Once the Zod model confirms the structural schema contract, the unified frontend layer evaluates and catches the strict assignment edge cases through simple code operations:

*   **Out of Order Answers:** The layout system relies completely on the data maps rather than file order. The right hand panel matches highlights dynamically, ensuring that even if Question 5 is answered at the top of Page 1, it matches perfectly.
*   **Unanswered Questions:** Checked dynamically in the sidebar component loop:
    ```typescript
    const isUnanswered = !extractedData.mappings.some(m => m.questionId === currentQuestion.id);
    ```
    If true, the UI changes the theme of that sidebar item to a gray tone and blocks scoring interactions.
*   **Unmatched Answers:** The AI maps arbitrary or poorly labelled handwritten student work directly to `questionId: null`. The UI filters these separate records into a specialized layout block, letting teachers look over extra pages or unnumbered sections easily.

### 4. Phase 4: Stacking the Canvas Highlights

The split panel workspace relies on native browser viewport primitives. Each page item inside `components/document-workspace.tsx` sets up its layout anchor using `position: relative`:

```html
<!-- Base Container Layer (Anchors coordinates inside its borders) -->
<div class="relative w-full overflow-hidden rounded-lg border border-border shadow-sm">
  
  <!-- Layer 1 (The Backdrop): Scaled image from browser memory -->
  <img src="blob:http://localhost:3000/xyz-123" class="w-full" />

  <!-- Layer 2 (The Interactive SVG Tracing Paper Overlay): Stacks exactly on top -->
  <svg class="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100">
    <!-- Code loops through filtered coordinate objects for this page and injects rectangles -->
    <rect x="15" y="45" width="45" height="15" fill="rgba(...)" />
  </svg>
</div>
```

When a user selects a question card in the sidebar, the top level React page state variable changes. This signals the transparent SVG component to look up the new coordinates from memory and redraw the highlight boxes instantly.

Because we decoupled the layout display into clean images rather than rigid browser controlled PDF plugins, the boxes remain locked perfectly onto the target lines even when the teacher scrolls or changes window sizes.
