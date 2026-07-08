import Dexie, { type Table } from 'dexie'
import type { Document, Chunk, Manifest } from './types'

class RecallwellDatabase extends Dexie {
  documents!: Table<Document>
  chunks!: Table<Chunk>
  manifest!: Table<Manifest>

  constructor() {
    super('recallwell-nano')
    this.version(1).stores({
      documents: '++id, title, source, mime, ingestedAt, hash',
      chunks: '++id, docId, ordinal, text, headingPath, tokenEstimate, summary, keywords',
      manifest: '++id, kbName, createdAt, docCount, chunkCount, version, contentHash',
    })
  }
}

export const db = new RecallwellDatabase()
