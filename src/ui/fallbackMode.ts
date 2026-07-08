export function renderFallbackMode(container: HTMLElement): void {
  container.innerHTML = `
    <div class="fallback-mode">
      <p>Running in keyword-only fallback mode.</p>
      <p>Answers will be based on keyword matching without AI ranking.</p>
    </div>
  `
}
