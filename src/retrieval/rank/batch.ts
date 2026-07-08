import type { RankCard } from './prompt'

const MAX_CARDS_PER_BATCH = 20

export function batchCards(cards: RankCard[]): RankCard[][] {
  const batches: RankCard[][] = []

  for (let i = 0; i < cards.length; i += MAX_CARDS_PER_BATCH) {
    batches.push(cards.slice(i, i + MAX_CARDS_PER_BATCH))
  }

  return batches
}
