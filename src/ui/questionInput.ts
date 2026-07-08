export interface QuestionInputCallbacks {
  onAsk: (question: string) => void
}

export function createQuestionInput(
  container: HTMLElement,
  callbacks: QuestionInputCallbacks,
): void {
  container.innerHTML = `
    <div class="question-input">
      <input type="text" id="question" placeholder="Ask a question..." />
      <button id="ask-btn">Ask</button>
    </div>
  `

  const input = container.querySelector('#question') as HTMLInputElement
  const btn = container.querySelector('#ask-btn') as HTMLButtonElement

  const ask = () => {
    const question = input.value.trim()
    if (question) {
      callbacks.onAsk(question)
      input.value = ''
    }
  }

  btn.addEventListener('click', ask)
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') ask()
  })
}
