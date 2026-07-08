import type { Document } from '../db/types'

export function renderDocumentList(
  container: HTMLElement,
  documents: Document[],
  callbacks: { onDelete: (id: number) => void },
): void {
  if (documents.length === 0) {
    container.innerHTML = `<div class="empty-state">No documents ingested yet. Drop some files above to get started.</div>`
    return
  }

  container.innerHTML = `
    <ul class="doc-list">
      ${documents
        .map(
          (doc) => `
        <li class="doc-item">
          <div class="doc-info">
            <span class="doc-name">${doc.title}</span>
            <span class="doc-meta">${doc.mime} &middot; ${new Date(doc.ingestedAt).toLocaleDateString()}</span>
          </div>
          <button class="doc-delete" data-id="${doc.id}">Remove</button>
        </li>
      `,
        )
        .join('')}
    </ul>
  `

  container.querySelectorAll('.doc-delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id') || '0', 10)
      if (id) callbacks.onDelete(id)
    })
  })
}
