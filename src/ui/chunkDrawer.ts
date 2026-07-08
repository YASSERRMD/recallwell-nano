import type { Chunk } from '../db/types'

let drawerOpen = false

export function createChunkDrawer(container: HTMLElement): void {
  if (drawerOpen) return
  drawerOpen = true

  container.innerHTML = `
    <div class="drawer-overlay" id="drawer-overlay">
      <div class="drawer">
        <div class="drawer-header">
          <span class="drawer-title" id="drawer-title">Source</span>
          <button class="drawer-close" id="close-drawer">&times;</button>
        </div>
        <div class="drawer-content" id="drawer-content"></div>
      </div>
    </div>
  `

  const overlay = container.querySelector('#drawer-overlay') as HTMLElement
  const closeBtn = container.querySelector('#close-drawer') as HTMLButtonElement

  const close = () => {
    container.innerHTML = ''
    drawerOpen = false
  }

  closeBtn.addEventListener('click', close)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close()
  })
}

export function showChunkDrawer(container: HTMLElement, chunk: Chunk): void {
  const title = container.querySelector('#drawer-title') as HTMLElement
  const content = container.querySelector('#drawer-content') as HTMLElement

  if (title) title.textContent = `Source: Doc ${chunk.docId} #${chunk.ordinal}`
  if (content) content.textContent = chunk.text
}
