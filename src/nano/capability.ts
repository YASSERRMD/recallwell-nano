export interface NanoCapability {
  available: boolean
  error?: string
}

export async function detectCapability(): Promise<NanoCapability> {
  try {
    if (!('LanguageModel' in self)) {
      return { available: false, error: 'LanguageModel API not available' }
    }

    const availability = await LanguageModel.availability()
    if (availability === 'unavailable') {
      return { available: false, error: 'Model unavailable on this device' }
    }

    return { available: true }
  } catch (e) {
    return { available: false, error: String(e) }
  }
}
