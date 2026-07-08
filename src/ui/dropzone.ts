export interface DropzoneOptions {
  onFiles: (files: File[]) => void
  accept?: string[]
}

export function createDropzone(container: HTMLElement, options: DropzoneOptions): void {
  const { onFiles, accept = ['.txt', '.md', '.html', '.pdf'] } = options

  container.innerHTML = `
    <div class="dropzone" id="dropzone">
      <p>Drag and drop files here</p>
      <p>or</p>
      <button id="file-select">Select files</button>
      <input type="file" id="file-input" multiple accept="${accept.join(',')}" hidden>
      <p class="dropzone-hint">Supported: ${accept.join(', ')}</p>
    </div>
  `

  const dropzone = container.querySelector('#dropzone') as HTMLElement
  const fileInput = container.querySelector('#file-input') as HTMLInputElement
  const fileSelect = container.querySelector('#file-select') as HTMLButtonElement

  fileSelect.addEventListener('click', () => fileInput.click())

  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files || [])
    if (files.length > 0) {
      onFiles(files)
    }
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
    if (files.length > 0) {
      onFiles(files)
    }
  })
}
