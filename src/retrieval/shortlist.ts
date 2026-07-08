import type { Chunk } from '../db/types'
import { buildInvertedIndex } from './invertedIndex'
import { bm25Score } from './bm25'

const SHORTLIST_SIZE = 30

export function shortlistCandidates(
  chunks: Chunk[],
  query: string,
  size: number = SHORTLIST_SIZE,
): number[] {
  const index = buildInvertedIndex(chunks)

  const scores: Array<{ id: number; score: number }> = []

  for (const chunk of chunks) {
    if (chunk.id === undefined) continue
    const score = bm25Score(index, query, chunk.id)
    if (score > 0) {
      scores.push({ id: chunk.id, score })
    }
  }

  scores.sort((a, b) => b.score - a.score)

  return scores.slice(0, size).map((s) => s.id)
}
