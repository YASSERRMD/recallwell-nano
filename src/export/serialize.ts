import type { Document, Chunk, Manifest } from '../db/types'

export interface RWKBSnapshot {
  version: string
  documents: Document[]
  chunks: Chunk[]
  manifest: Manifest
}

export function serializeSnapshot(
  documents: Document[],
  chunks: Chunk[],
  manifest: Manifest,
): RWKBSnapshot {
  return {
    version: '1.0.0',
    documents,
    chunks,
    manifest,
  }
}
