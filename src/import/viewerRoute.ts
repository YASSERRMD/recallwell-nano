import type { ReadOnlyStore } from './mount'

export function renderViewerRoute(container: HTMLElement, store: ReadOnlyStore): void {
  container.innerHTML = `
    <div class="viewer-route">
      <div class="viewer-header">
        <h2>Read-Only Viewer</h2>
        <span class="read-only-badge">Read Only</span>
      </div>
      <div class="viewer-stats">
        <p><strong>KB Name:</strong> ${store.snapshot.manifest.kbName}</p>
        <p><strong>Documents:</strong> ${store.snapshot.manifest.docCount}</p>
        <p><strong>Chunks:</strong> ${store.snapshot.manifest.chunkCount}</p>
      </div>
      <div id="viewer-qa"></div>
    </div>
  `
}
