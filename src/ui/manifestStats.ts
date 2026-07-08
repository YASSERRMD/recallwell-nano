import type { Manifest } from '../db/types'

export function renderManifestStats(container: HTMLElement, manifest: Manifest | undefined): void {
  container.innerHTML = `
    <div class="manifest-stats">
      <h3>Knowledge Base Stats</h3>
      ${manifest ? `
        <p><strong>Name:</strong> ${manifest.kbName}</p>
        <p><strong>Documents:</strong> ${manifest.docCount}</p>
        <p><strong>Chunks:</strong> ${manifest.chunkCount}</p>
        <p><strong>Version:</strong> ${manifest.version}</p>
      ` : '<p>No manifest available.</p>'}
    </div>
  `
}
