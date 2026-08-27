'use client'

import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

/**
 * Renders each page of a PDF file to a blob URL image string.
 * This is the client-side Display Branch per ADR-01:
 * converts PDF pages into browser-native canvas-backed images
 * so SVG bounding box overlays stay pixel-accurate.
 */
export async function renderPdfToImages(file: File, scale = 2): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const urls: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!

    await page.render({ canvasContext: ctx, viewport }).promise

    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/png'),
    )
    urls.push(URL.createObjectURL(blob))
  }

  return urls
}
