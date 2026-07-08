export function createExportButton(
  container: HTMLElement,
  callbacks: { onExport: () => void },
): void {
  container.innerHTML = `
    <button class="export-btn" id="export-btn">Export Knowledge Base</button>
    <div id="export-confirmation" style="display: none;"></div>
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

  if (confirmation) {
    confirmation.style.display = 'block'
    confirmation.innerHTML = `<div class="export-success">Export complete! Check your downloads.</div>`
  }
  if (btn) {
    btn.disabled = false
    btn.textContent = 'Export Knowledge Base'
  }
}
