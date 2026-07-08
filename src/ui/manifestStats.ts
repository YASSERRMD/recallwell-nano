import type { Manifest } from '../db/types'

export function renderManifestStats(container: HTMLElement, manifest: Manifest | undefined): void {
  if (!manifest) {
    container.innerHTML = ''
    return
  }

  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${manifest.docCount}</div>
        <div class="stat-label">Documents</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${manifest.chunkCount}</div>
        <div class="stat-label">Chunks</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${manifest.kbName}</div>
        <div class="stat-label">Knowledge Base</div>
      </div>
    </div>
  `
}
