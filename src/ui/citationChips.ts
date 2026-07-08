import type { Chunk } from '../db/types'

export interface CitationChipsCallbacks {
  onCitationClick: (chunk: Chunk) => void
}

export function renderCitationChips(
  container: HTMLElement,
  chunks: Chunk[],
  callbacks: CitationChipsCallbacks,
): void {
  container.innerHTML = `
    <div class="citation-chips">
      ${chunks
        .map(
          (chunk) => `
        <button class="citation-chip" data-chunk-id="${chunk.id}">
          ${chunk.docId}#${chunk.ordinal}
        </button>
      `,
        )
        .join('')}
    </div>
  `

  container.querySelectorAll('.citation-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const chunkId = parseInt(chip.getAttribute('data-chunk-id') || '0', 10)
      const chunk = chunks.find((c) => c.id === chunkId)
      if (chunk) callbacks.onCitationClick(chunk)
    })
  })
}
