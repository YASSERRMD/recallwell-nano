export interface ExportButtonCallbacks {
  onExport: () => void
}

export function createExportButton(
  container: HTMLElement,
  callbacks: ExportButtonCallbacks,
): void {
  container.innerHTML = `
    <button id="export-btn">Export Knowledge Base</button>
    <div id="export-confirmation" style="display: none;">
      <p>Export complete!</p>
    </div>
  `

  const btn = container.querySelector('#export-btn') as HTMLButtonElement

  btn.addEventListener('click', async () => {
    btn.disabled = true
    btn.textContent = 'Exporting...'
    callbacks.onExport()
  })
}

export function showExportConfirmation(container: HTMLElement): void {
  const confirmation = container.querySelector('#export-confirmation') as HTMLElement
  const btn = container.querySelector('#export-btn') as HTMLButtonElement

  if (confirmation) confirmation.style.display = 'block'
  if (btn) {
    btn.disabled = false
    btn.textContent = 'Export Knowledge Base'
  }
}
