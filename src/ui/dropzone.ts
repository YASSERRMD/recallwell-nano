export function createDropzone(container: HTMLElement, options: { onFiles: (files: File[]) => void }): void {
  const { onFiles } = options

  container.innerHTML = `
    <div class="dropzone" id="dropzone">
      <div class="dropzone-icon">📁</div>
      <div class="dropzone-text">Drag and drop files here, or <strong>browse</strong></div>
      <div class="dropzone-hint">Supports .txt, .md, .html, .pdf</div>
      <input type="file" id="file-input" multiple accept=".txt,.md,.html,.pdf" hidden>
    </div>
  `

  const dropzone = container.querySelector('#dropzone') as HTMLElement
  const fileInput = container.querySelector('#file-input') as HTMLInputElement

  dropzone.addEventListener('click', () => fileInput.click())

  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files || [])
    if (files.length > 0) onFiles(files)
    fileInput.value = ''
  })

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault()
    dropzone.classList.add('dropzone-active')
  })

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dropzone-active')
  })

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault()
    dropzone.classList.remove('dropzone-active')
    const files = Array.from(e.dataTransfer?.files || [])
    if (files.length > 0) onFiles(files)
  })
}
