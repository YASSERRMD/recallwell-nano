import type { Document } from '../db/types'

export interface DocumentListCallbacks {
  onDelete: (id: number) => void
}

export function renderDocumentList(
  container: HTMLElement,
  documents: Document[],
  callbacks: DocumentListCallbacks,
): void {
  container.innerHTML = `
    <div class="document-list">
      <h3>Documents</h3>
      ${documents.length === 0 ? '<p>No documents ingested yet.</p>' : ''}
      <ul id="doc-list">
        ${documents
          .map(
            (doc) => `
          <li>
            <span>${doc.title}</span>
            <span class="doc-meta">${doc.mime} - ${new Date(doc.ingestedAt).toLocaleDateString()}</span>
            <button class="delete-btn" data-id="${doc.id}">Delete</button>
          </li>
        `,
          )
          .join('')}
      </ul>
    </div>
  `

  container.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id') || '0', 10)
      if (id) callbacks.onDelete(id)
    })
  })
}
