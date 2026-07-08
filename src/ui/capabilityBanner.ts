export function renderCapabilityBanner(
  container: HTMLElement,
  available: boolean,
  error?: string,
): void {
  container.innerHTML = `
    <div class="capability-banner ${available ? 'capable' : 'incapable'}">
      ${available
        ? '<p>Chrome Built-in AI is available.</p>'
        : `<p>Chrome Built-in AI is not available. ${error || ''}</p>
           <p>Visit <code>chrome://flags/#enable-built-in-ai</code> to enable Gemini Nano.</p>`
      }
    </div>
  `
}
