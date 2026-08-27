# Architectural Decision Records (ADRs)

Each entry outlines the decision, the rationale, considered alternatives, and the applicable project phase. These decisions establish the engineering standards for the VedaAI extraction pipeline.

---

## ADR-01: Treat Display and AI Consumers Differently

**Decision:** Send the raw PDF or image to the AI model natively for extraction. Separately, render PDF pages to images client side for the display and highlight layer. Do not use a native `<object>` or `<iframe>` PDF embed as the baseline for overlaying highlight boxes.

**Rationale:** The AI model (Gemini) reads PDFs natively; bypassing an OCR pipeline or page splitting requirement for extraction saves significant engineering overhead and reduces latency. However, a native browser PDF embed manages its own internal scroll and zoom states, which are invisible to the DOM. An absolutely positioned overlay box on top of it will not track the document reliably during scrolling or zooming. Rendering the page to an `<img>` element (via `pdfjs-dist` on the client) provides a standard DOM element with absolute dimensional control, guaranteeing that percentage based bounding boxes remain pixel accurate.

**Alternatives Considered:**
*   **Native PDF embed for display:** Rejected. Layout tracking breaks under native scroll/zoom events.
*   **Server side PDF to image conversion:** Rejected. Introduces an unnecessary server dependency (e.g., `pdf-to-img` system binaries) offering no functional benefit over client side `pdfjs-dist` rendering, especially given the ephemeral nature of the session.

---

## ADR-02: Server Actions Over API Routes

**Decision:** Utilize Next.js Server Actions (`'use server'`) for the upload and extraction proxy layer rather than standard `/api/*` route handlers. A custom body size limit must be explicitly set.

**Rationale:** Both approaches successfully obfuscate the model API key on the server. Server Actions are invoked as a direct function call from a React component, which minimizes boilerplate (eliminating `fetch()` and manual JSON serialization) and aligns with the existing form submission architecture. 
*Note on Limits:* Server Actions default to a 1MB request body limit. A multi page handwritten answer sheet PDF easily exceeds this constraint. The limit is explicitly overridden in the configuration:
```js
// next.config.mjs
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '15mb' },
  },
};
```

---

## ADR-03: Unified React State Management

**Decision:** Maintain application state via standard `useState` hooks at the top level page component. Defer the introduction of external state management libraries (e.g., Zustand or Redux).

**Rationale:** The application is architected around a single primary workspace view with a shallow component tree. The state requirements (`extractedData`, `selectedQuestionId`, `renderedPages`, `isProcessing`) are minimal and easily propagated via props. Introducing an external state manager adds unnecessary dependency overhead for the current scope. This decision can be revisited if the workflow expands into deeply nested multi step processes.

---

## ADR-04: Centralized Zod Data Contract

**Decision:** Adopt a strict Zod schema as the absolute source of truth for data flowing between the AI extraction layer and the frontend UI.

**Rationale:** Vision LLMs are stochastic. Enforcing a strict schema guarantees interface stability and prevents UI crashes due to malformed payloads.
*   `questionId: null` explicitly represents the edge case where a student provided an answer that the AI could not confidently map to a known question.
*   Unanswered questions are determined dynamically by the absence of a mapping reference (`!mappings.some(m => m.questionId === q.id)`), ensuring a single source of truth.
*   `coordinates` is strictly typed as an array of bounding boxes (`[xmin, ymin, xmax, ymax, page]`), intrinsically supporting both single region and multi page spanning answers without requiring divergent rendering logic.

---

## ADR-05: Ephemeral State Architecture

**Decision:** The application operates entirely in memory. Files are processed as browser `Blob` or `File` objects, streamed to the server per request, and immediately discarded. No data is written to disk or a persistent database.

**Rationale:** The scope of the project requires an extraction and mapping pipeline. Implementing a persistent storage layer (e.g., AWS S3, PostgreSQL) introduces infrastructure complexity, security overhead, and latency that does not serve the core objective. Session data is ephemeral by design, resetting upon browser refresh or explicit user action.

---

## ADR-06: High Availability Model Fallbacks

**Decision:** Implement a cascading model fallback pipeline that routes requests to a secondary provider if the primary vision model cluster fails due to high demand.

**Rationale:** Relying on a single API endpoint (e.g., Gemini) introduces a single point of failure, particularly during periods of global high demand (HTTP 503 errors). The system handles this by catching the failure, utilizing `pdf-parse` to extract raw text buffers from the documents, and routing the text to a high capacity LLaMA model on the Groq network. While this fallback trades spatial bounding box accuracy for text only extraction, it guarantees system uptime and continuous grading capability.
