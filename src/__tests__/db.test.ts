import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '../db/index'
import { addDocument, getDocument, listDocuments, deleteDocument } from '../db/repositories/document'
import { bulkAddChunks, getChunksByDoc, getAllChunks } from '../db/repositories/chunk'
import { upsertManifest, getManifest } from '../db/repositories/manifest'

beforeEach(async () => {
  await db.documents.clear()
  await db.chunks.clear()
  await db.manifest.clear()
})

describe('Document repository', () => {
  it('should add and retrieve a document', async () => {
    const id = await addDocument({
      title: 'Test Doc',
      source: 'test.txt',
      mime: 'text/plain',
      hash: 'abc123',
    })

    const doc = await getDocument(id)
    expect(doc).toBeDefined()
    expect(doc?.title).toBe('Test Doc')
  })

  it('should list documents', async () => {
    await addDocument({ title: 'Doc 1', source: 'a.txt', mime: 'text/plain', hash: 'h1' })
    await addDocument({ title: 'Doc 2', source: 'b.txt', mime: 'text/plain', hash: 'h2' })

    const docs = await listDocuments()
    expect(docs.length).toBe(2)
  })

  it('should delete document and its chunks', async () => {
    const docId = await addDocument({ title: 'Doc', source: 'x.txt', mime: 'text/plain', hash: 'h' })
    await bulkAddChunks([
      { docId, ordinal: 0, text: 'chunk1', headingPath: '', tokenEstimate: 1, summary: '', keywords: '' },
    ])

    await deleteDocument(docId)

    const doc = await getDocument(docId)
    expect(doc).toBeUndefined()
    const chunks = await getChunksByDoc(docId)
    expect(chunks.length).toBe(0)
  })
})

describe('Chunk repository', () => {
  it('should bulk add and retrieve chunks by doc', async () => {
    const docId = await addDocument({ title: 'Doc', source: 'x.txt', mime: 'text/plain', hash: 'h' })
    await bulkAddChunks([
      { docId, ordinal: 0, text: 'chunk0', headingPath: '', tokenEstimate: 1, summary: '', keywords: '' },
      { docId, ordinal: 1, text: 'chunk1', headingPath: '', tokenEstimate: 1, summary: '', keywords: '' },
    ])

    const chunks = await getChunksByDoc(docId)
    expect(chunks.length).toBe(2)
  })

  it('should get all chunks', async () => {
    const docId = await addDocument({ title: 'Doc', source: 'x.txt', mime: 'text/plain', hash: 'h' })
    await bulkAddChunks([
      { docId, ordinal: 0, text: 'chunk0', headingPath: '', tokenEstimate: 1, summary: '', keywords: '' },
    ])

    const all = await getAllChunks()
    expect(all.length).toBe(1)
  })
})

describe('Manifest repository', () => {
  it('should upsert and retrieve manifest', async () => {
    await upsertManifest({
      kbName: 'Test KB',
      createdAt: Date.now(),
      docCount: 1,
      chunkCount: 10,
      version: '1.0.0',
      contentHash: 'hash123',
    })

    const manifest = await getManifest()
    expect(manifest).toBeDefined()
    expect(manifest?.kbName).toBe('Test KB')
  })

  it('should replace existing manifest on upsert', async () => {
    await upsertManifest({
      kbName: 'First',
      createdAt: Date.now(),
      docCount: 1,
      chunkCount: 5,
      version: '1.0.0',
      contentHash: 'h1',
    })

    await upsertManifest({
      kbName: 'Second',
      createdAt: Date.now(),
      docCount: 2,
      chunkCount: 10,
      version: '1.0.0',
      contentHash: 'h2',
    })

    const manifest = await getManifest()
    expect(manifest?.kbName).toBe('Second')
  })
})
