import { db } from '../index'
import type { Chunk } from '../types'

export async function bulkAddChunks(chunks: Omit<Chunk, 'id'>[]): Promise<void> {
  await db.chunks.bulkAdd(chunks as Chunk[])
}

export async function getChunksByDoc(docId: number): Promise<Chunk[]> {
  return db.chunks.where('docId').equals(docId).toArray()
}

export async function getAllChunks(): Promise<Chunk[]> {
  return db.chunks.toArray()
}

export async function getChunksByIds(ids: number[]): Promise<Chunk[]> {
  const results = await db.chunks.bulkGet(ids)
  return results.filter((c): c is Chunk => c !== undefined)
}
