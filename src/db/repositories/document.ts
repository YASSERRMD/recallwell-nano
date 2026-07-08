import { db } from './index'
import type { Document } from './types'

export async function addDocument(doc: Omit<Document, 'id' | 'ingestedAt'>): Promise<number> {
  return db.documents.add({
    ...doc,
    ingestedAt: Date.now(),
  })
}

export async function getDocument(id: number): Promise<Document | undefined> {
  return db.documents.get(id)
}

export async function listDocuments(): Promise<Document[]> {
  return db.documents.toArray()
}

export async function deleteDocument(id: number): Promise<void> {
  await db.documents.delete(id)
  await db.chunks.where('docId').equals(id).delete()
}
