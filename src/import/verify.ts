import type { RWKBSnapshot } from '../export/serialize'
import { computeContentHash } from '../export/hash'

export async function verifySnapshot(snapshot: RWKBSnapshot): Promise<boolean> {
  const computedHash = await computeContentHash(snapshot)
  return computedHash === snapshot.manifest.contentHash
}
