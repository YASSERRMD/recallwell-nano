interface LanguageModelPromptOptions {
  systemPrompt?: string
}

interface LanguageModelSession {
  prompt(input: string): Promise<string>
  destroy(): void
}

interface LanguageModelCapabilities {
  available: boolean
}

interface LanguageModel {
  capabilities(): Promise<LanguageModelCapabilities>
  create(options?: LanguageModelPromptOptions): Promise<LanguageModelSession>
}

interface AI {
  languageModel?: LanguageModel
}

declare global {
  interface Window {
    ai?: AI
  }
}

export {}
