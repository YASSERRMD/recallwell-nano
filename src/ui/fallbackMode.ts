export function renderFallbackMode(container: HTMLElement): void {
  container.innerHTML = `
    <div class="fallback-banner">
      Running in keyword-only mode. Enable Chrome Built-in AI for AI-powered answers.
    </div>
  `
}
