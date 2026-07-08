import './types'

export interface NanoCapability {
  available: boolean
  error?: string
}

export async function detectCapability(): Promise<NanoCapability> {
  try {
    if (!window.ai) {
      return { available: false, error: 'window.ai not available' }
    }

    if (!window.ai.languageModel) {
      return { available: false, error: 'LanguageModel API not available' }
    }

    const canCreate = await window.ai.languageModel.capabilities()
    if (canCreate && canCreate.available) {
      return { available: true }
    }

    return { available: false, error: 'LanguageModel not ready' }
  } catch (e) {
    return { available: false, error: String(e) }
  }
}
