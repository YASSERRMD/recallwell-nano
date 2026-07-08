import type { NanoSession } from '../nano/session'
import { promptJSON } from '../nano/structured'
import { buildIndexCardPrompt } from './prompt'

export interface IndexCard {
  summary: string
  keywords: string[]
}

export async function generateIndexCard(
  session: NanoSession,
  text: string,
): Promise<IndexCard> {
  const prompt = buildIndexCardPrompt(text)
  return promptJSON<IndexCard>(session, prompt)
}
