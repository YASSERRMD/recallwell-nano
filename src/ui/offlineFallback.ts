export function renderOfflineFallback(container: HTMLElement): void {
  container.innerHTML = `
    <div class="offline-fallback">
      <h2>You are offline</h2>
      <p>Please check your internet connection and try again.</p>
      <p>If you have previously ingested documents, they may still be available in the app.</p>
    </div>
  `
}
