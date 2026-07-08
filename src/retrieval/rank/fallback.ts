import type { Chunk } from '../../db/types'
import { shortlistCandidates } from '../shortlist'

export function fallbackRank(chunks: Chunk[], question: string): number[] {
  return shortlistCandidates(chunks, question)
}
