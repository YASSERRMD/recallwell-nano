import { describe, it, expect } from 'vitest'
import { renderOfflineFallback } from '../ui/offlineFallback'
import { captureInstallPrompt, isInstallable } from '../ui/installPrompt'

describe('Offline fallback', () => {
  it('should render offline message', () => {
    const container = document.createElement('div')
    renderOfflineFallback(container)
    expect(container.textContent).toContain('offline')
  })
})

describe('Install prompt', () => {
  it('should not be installable by default', () => {
    expect(isInstallable()).toBe(false)
  })
})
