import type { RWKBSnapshot } from '../export/serialize'

export interface ReadOnlyStore {
  snapshot: RWKBSnapshot
  isReadOnly: true
}

export function mountReadOnlyStore(snapshot: RWKBSnapshot): ReadOnlyStore {
  return {
    snapshot,
    isReadOnly: true,
  }
}
