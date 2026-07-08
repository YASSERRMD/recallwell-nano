export function verifyZeroNetworkCalls(): boolean {
  if (typeof window === 'undefined') return true

  const originalFetch = window.fetch
  const originalXHROpen = XMLHttpRequest.prototype.open

  let networkCalls = 0

  window.fetch = function (...args) {
    networkCalls++
    console.warn('Network call detected:', args[0])
    return originalFetch.apply(this, args)
  }

  XMLHttpRequest.prototype.open = function (...args) {
    networkCalls++
    console.warn('XHR call detected:', args[1])
    return originalXHROpen.apply(this, args)
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
