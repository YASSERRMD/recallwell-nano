export interface NanoSession {
  prompt: (input: string) => Promise<string>
  destroy: () => void
}

export async function createSession(): Promise<NanoSession> {
  if (!('LanguageModel' in self)) {
    throw new Error('LanguageModel API not available')
  }

  const session = await LanguageModel.create()

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
