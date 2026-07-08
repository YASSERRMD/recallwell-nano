export function createQuestionInput(
  container: HTMLElement,
  callbacks: { onAsk: (question: string) => void },
): void {
  container.innerHTML = `
    <div class="question-form">
      <input type="text" class="question-input" id="question" placeholder="Ask anything about your documents...">
      <button class="ask-btn" id="ask-btn">Ask</button>
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
