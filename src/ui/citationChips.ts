import type { Chunk } from '../db/types'

export function renderCitationChips(
  container: HTMLElement,
  chunks: Chunk[],
  callbacks: { onCitationClick: (chunk: Chunk) => void },
): void {
  container.innerHTML = `
    <div class="citations">
      <span class="citations-label">Sources:</span>
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
