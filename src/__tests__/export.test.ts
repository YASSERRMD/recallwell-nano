import { describe, it, expect } from 'vitest'
import { serializeSnapshot } from '../export/serialize'
import { computeContentHash } from '../export/hash'
import type { Document, Chunk, Manifest } from '../db/types'

const mockDocuments: Document[] = [
  { id: 1, title: 'Test', source: 'test.txt', mime: 'text/plain', ingestedAt: Date.now(), hash: 'abc' },
]

const mockChunks: Chunk[] = [
  { id: 1, docId: 1, ordinal: 0, text: 'Content', headingPath: '', tokenEstimate: 1, summary: 'Summary', keywords: 'kw' },
]

const mockManifest: Manifest = {
  id: 1,
  kbName: 'Test KB',
  createdAt: Date.now(),
  docCount: 1,
  chunkCount: 1,
  version: '1.0.0',
  contentHash: '',
}

describe('serializeSnapshot', () => {
  it('should serialize to RWKB format', () => {
    const snapshot = serializeSnapshot(mockDocuments, mockChunks, mockManifest)
    expect(snapshot.version).toBe('1.0.0')
    expect(snapshot.documents.length).toBe(1)
    expect(snapshot.chunks.length).toBe(1)
  })
})

describe('computeContentHash', () => {
  it('should compute hash', async () => {
    const snapshot = serializeSnapshot(mockDocuments, mockChunks, mockManifest)
    const hash = await computeContentHash(snapshot)
    expect(hash).toHaveLength(64)
  })
})
