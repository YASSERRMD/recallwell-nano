import type { Chunk } from '../db/types'
import { getChunksByIds } from '../db/repositories/chunk'

export async function loadTopKChunks(ids: number[]): Promise<Chunk[]> {
  const chunks = await getChunksByIds(ids)
  return chunks.filter((c): c is Chunk => c !== undefined)
}
