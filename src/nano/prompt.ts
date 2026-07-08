import type { NanoSession } from './session'

export interface PromptOptions {
  timeout?: number
  signal?: AbortSignal
}

export async function promptWithTimeout(
  session: NanoSession,
  input: string,
  options: PromptOptions = {},
): Promise<string> {
  const { timeout = 30000 } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const result = await session.prompt(input)
    return result
  } finally {
    clearTimeout(timeoutId)
  }
}
