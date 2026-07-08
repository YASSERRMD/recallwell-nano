import { db } from '../db/index'
import type { IndexCard } from './generator'

export async function persistIndexCards(cards: Map<number, IndexCard>): Promise<void> {
  const updates: Promise<void>[] = []

  cards.forEach((card, chunkId) => {
    updates.push(
      db.chunks.update(chunkId, {
        summary: card.summary,
        keywords: card.keywords.join(', '),
      }),
    )
  })

  await Promise.all(updates)
}
