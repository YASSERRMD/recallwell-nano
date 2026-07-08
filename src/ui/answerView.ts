export function createAnswerView(container: HTMLElement): void {
  container.innerHTML = `
    <div class="answer-view" id="answer-view">
      <div class="answer-content" id="answer-content"></div>
      <div class="answer-loading" id="answer-loading" style="display: none;">
        <div class="spinner"></div>
        <span>Thinking...</span>
      </div>
    </div>
  `
}

export function showLoading(container: HTMLElement): void {
  const loading = container.querySelector('#answer-loading') as HTMLElement
  const content = container.querySelector('#answer-content') as HTMLElement
  if (loading) loading.style.display = 'flex'
  if (content) content.textContent = ''
}

export function hideLoading(container: HTMLElement): void {
  const loading = container.querySelector('#answer-loading') as HTMLElement
  if (loading) loading.style.display = 'none'
}

export function setAnswer(container: HTMLElement, text: string): void {
  const content = container.querySelector('#answer-content') as HTMLElement
  if (content) content.textContent = text
}
