import type { Chunk } from '../db/types'

export function createChunkDrawer(container: HTMLElement): void {
  container.innerHTML = `
    <div class="chunk-drawer" id="chunk-drawer" style="display: none;">
      <div class="drawer-header">
        <h3 id="drawer-title">Source Chunk</h3>
        <button id="close-drawer">Close</button>
      </div>
      <div id="drawer-content"></div>
    </div>
  `

  const drawer = container.querySelector('#chunk-drawer') as HTMLElement
  const closeBtn = container.querySelector('#close-drawer') as HTMLButtonElement

  closeBtn.addEventListener('click', () => {
    drawer.style.display = 'none'
  })
}

export function showChunkDrawer(container: HTMLElement, chunk: Chunk): void {
  const drawer = container.querySelector('#chunk-drawer') as HTMLElement
  const title = container.querySelector('#drawer-title') as HTMLElement
  const content = container.querySelector('#drawer-content') as HTMLElement

  if (title) title.textContent = `Chunk ${chunk.docId}#${chunk.ordinal}`
  if (content) content.textContent = chunk.text
  if (drawer) drawer.style.display = 'block'
}
