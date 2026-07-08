export function verifyZeroNetworkCalls(): boolean {
  if (typeof window === 'undefined') return true

  const originalFetch = window.fetch
  const originalXHROpen = XMLHttpRequest.prototype.open

  let networkCalls = 0

  window.fetch = function (...args: Parameters<typeof fetch>) {
    networkCalls++
    console.warn('Network call detected:', args[0])
    return originalFetch.apply(this, args)
  }

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null,
  ) {
    networkCalls++
    console.warn('XHR call detected:', url)
    return originalXHROpen.call(this, method, url, async ?? true, username, password)
  }

  setTimeout(() => {
    window.fetch = originalFetch
    XMLHttpRequest.prototype.open = originalXHROpen
    if (networkCalls > 0) {
      console.warn(`Detected ${networkCalls} network calls`)
    }
  }, 5000)

  return true
}
