import type { RWKBSnapshot } from './serialize'
import { computeHash } from '../ingest/hash'

export async function computeContentHash(snapshot: RWKBSnapshot): Promise<string> {
  const content = JSON.stringify({
    documents: snapshot.documents,
    chunks: snapshot.chunks,
    manifest: snapshot.manifest,
  })
  return computeHash(content)
}
