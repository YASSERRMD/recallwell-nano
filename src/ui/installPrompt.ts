export interface InstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: InstallPrompt | null = null

export function captureInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as unknown as InstallPrompt
  })
}

export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) return false

  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null

  return outcome === 'accepted'
}

export function isInstallable(): boolean {
  return deferredPrompt !== null
}
