export function createProgressBar(container: HTMLElement): void {
  container.innerHTML = `
    <div class="progress-item">
      <span class="progress-label">Parse</span>
      <div class="progress-bar"><div class="progress-fill" id="parse-progress"></div></div>
      <span class="progress-percent" id="parse-percent">0%</span>
    </div>
    <div class="progress-item">
      <span class="progress-label">Chunk</span>
      <div class="progress-bar"><div class="progress-fill" id="chunk-progress"></div></div>
      <span class="progress-percent" id="chunk-percent">0%</span>
    </div>
    <div class="progress-item">
      <span class="progress-label">Index</span>
      <div class="progress-bar"><div class="progress-fill" id="index-progress"></div></div>
      <span class="progress-percent" id="index-percent">0%</span>
    </div>
  `
}

export function updateProgress(
  container: HTMLElement,
  state: { parse: number; chunk: number; indexCard: number },
): void {
  const setProgress = (id: string, pct: number) => {
    const fill = container.querySelector(`#${id}-progress`) as HTMLElement
    const label = container.querySelector(`#${id}-percent`) as HTMLElement
    if (fill) fill.style.width = `${pct}%`
    if (label) label.textContent = `${pct}%`
  }

  setProgress('parse', state.parse)
  setProgress('chunk', state.chunk)
  setProgress('index', state.indexCard)
}
