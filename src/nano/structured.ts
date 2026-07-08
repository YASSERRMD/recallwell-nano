import type { NanoSession } from './session'

export async function promptJSON<T>(
  session: NanoSession,
  input: string,
): Promise<T> {
  const jsonPrompt = `${input}\n\nRespond with valid JSON only. No markdown, no explanation.`
  const result = await session.prompt(jsonPrompt)

  const cleaned = result.replace(/```json\n?|\n?```/g, '').trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    throw new Error(`Failed to parse JSON response: ${cleaned}`)
  }
}
