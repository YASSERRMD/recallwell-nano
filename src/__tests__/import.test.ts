import { describe, it, expect } from 'vitest'
import { validateSnapshotIntegrity } from '../import/validate'
import { mountReadOnlyStore } from '../import/mount'
import type { RWKBSnapshot } from '../export/serialize'

const validSnapshot: RWKBSnapshot = {
  version: '1.0.0',
  documents: [],
  chunks: [],
  manifest: {
    kbName: 'Test',
    createdAt: Date.now(),
    docCount: 0,
    chunkCount: 0,
    version: '1.0.0',
    contentHash: 'abc',
  },
}

describe('validateSnapshotIntegrity', () => {
  it('should accept valid snapshot', () => {
    const result = validateSnapshotIntegrity(validSnapshot)
    expect(result.valid).toBe(true)
  })

  it('should reject missing version', () => {
    const snapshot = { ...validSnapshot, version: '' }
    const result = validateSnapshotIntegrity(snapshot)
    expect(result.valid).toBe(false)
  })

  it('should reject version mismatch', () => {
    const snapshot = { ...validSnapshot, version: '2.0.0' }
    const result = validateSnapshotIntegrity(snapshot)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Version mismatch')
  })
})

describe('mountReadOnlyStore', () => {
  it('should mount snapshot as read-only', () => {
    const store = mountReadOnlyStore(validSnapshot)
    expect(store.isReadOnly).toBe(true)
    expect(store.snapshot).toBe(validSnapshot)
  })
})
