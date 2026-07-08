import './types'

export interface NanoSession {
  prompt: (input: string) => Promise<string>
  destroy: () => void
}

export async function createSession(systemPrompt?: string): Promise<NanoSession> {
  if (!window.ai?.languageModel) {
    throw new Error('LanguageModel API not available')
  }

  const session = await window.ai.languageModel.create({
    systemPrompt: systemPrompt || 'You are a helpful assistant.',
  })

  return {
    prompt: async (input: string) => {
      const result = await session.prompt(input)
      return result
    },
    destroy: () => {
      session.destroy()
    },
  }
}
