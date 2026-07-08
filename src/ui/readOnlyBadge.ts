export function renderReadOnlyBadge(container: HTMLElement, kbName: string): void {
  container.innerHTML = `
    <div class="read-only-badge-container">
      <span class="read-only-badge">Read Only</span>
      <span class="kb-name">${kbName}</span>
    </div>
  `
}
