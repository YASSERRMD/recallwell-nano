import type { NanoSession } from '../nano/session'
import type { Chunk } from '../db/types'
import { generateIndexCard, type IndexCard } from './generator'

export interface ProgressCallback {
  (current: number, total: number): void
}

export async function generateIndexCardsBatch(
  session: NanoSession,
  chunks: Chunk[],
  onProgress?: ProgressCallback,
): Promise<Map<number, IndexCard>> {
  const results = new Map<number, IndexCard>()

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    if (chunk.id === undefined) continue

    try {
      const card = await generateIndexCard(session, chunk.text)
      results.set(chunk.id, card)
    } catch (e) {
      console.error(`Failed to generate index card for chunk ${chunk.id}:`, e)
    }

    onProgress?.(i + 1, chunks.length)
  }

  return results
}
