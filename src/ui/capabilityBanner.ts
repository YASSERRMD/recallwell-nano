export function renderCapabilityBanner(container: HTMLElement, available: boolean, error?: string): void {
  if (available) {
    container.innerHTML = `<div class="banner banner-capable">Chrome Built-in AI is ready</div>`
  } else {
    container.innerHTML = `
      <div class="banner banner-incapable">
        Chrome Built-in AI not available${error ? `: ${error}` : ''}.
        Visit <code>chrome://flags/#enable-built-in-ai</code> to enable.
      </div>
    `
  }
}
