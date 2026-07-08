import type { NanoSession } from '../../nano/session'
import { promptJSON } from '../../nano/structured'
import { buildRankPrompt, type RankCard } from './prompt'
import { batchCards } from './batch'

export async function rankWithLLM(
  session: NanoSession,
  cards: RankCard[],
  question: string,
): Promise<number[]> {
  const batches = batchCards(cards)
  const allIds: number[] = []

  for (const batch of batches) {
    const prompt = buildRankPrompt(batch, question)
    const ids = await promptJSON<number[]>(session, prompt)
    allIds.push(...ids.filter((id) => batch.some((c) => c.id === id)))
  }

  const seen = new Set<number>()
  return allIds.filter((id) => {
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}
