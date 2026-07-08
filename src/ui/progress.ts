export interface ProgressState {
  parse: number
  chunk: number
  indexCard: number
}

export function createProgressBar(container: HTMLElement): void {
  container.innerHTML = `
    <div class="progress-container">
      <div class="progress-item">
        <span>Parsing</span>
        <div class="progress-bar">
          <div class="progress-fill" id="parse-progress"></div>
        </div>
        <span id="parse-percent">0%</span>
      </div>
      <div class="progress-item">
        <span>Chunking</span>
        <div class="progress-bar">
          <div class="progress-fill" id="chunk-progress"></div>
        </div>
        <span id="chunk-percent">0%</span>
      </div>
      <div class="progress-item">
        <span>Indexing</span>
        <div class="progress-bar">
          <div class="progress-fill" id="index-progress"></div>
        </div>
        <span id="index-percent">0%</span>
      </div>
    </div>
  `
}

export function updateProgress(container: HTMLElement, state: ProgressState): void {
  const parseFill = container.querySelector('#parse-progress') as HTMLElement
  const chunkFill = container.querySelector('#chunk-progress') as HTMLElement
  const indexFill = container.querySelector('#index-progress') as HTMLElement
  const parsePercent = container.querySelector('#parse-percent') as HTMLElement
  const chunkPercent = container.querySelector('#chunk-percent') as HTMLElement
  const indexPercent = container.querySelector('#index-percent') as HTMLElement

  if (parseFill) parseFill.style.width = `${state.parse}%`
  if (chunkFill) chunkFill.style.width = `${state.chunk}%`
  if (indexFill) indexFill.style.width = `${state.indexCard}%`
  if (parsePercent) parsePercent.textContent = `${state.parse}%`
  if (chunkPercent) chunkPercent.textContent = `${state.chunk}%`
  if (indexPercent) indexPercent.textContent = `${state.indexCard}%`
}
