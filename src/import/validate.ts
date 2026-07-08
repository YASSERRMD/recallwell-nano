import type { RWKBSnapshot } from '../export/serialize'

export interface ValidationError {
  valid: boolean
  error?: string
}

export function validateSnapshotIntegrity(snapshot: RWKBSnapshot): ValidationError {
  if (!snapshot.version) {
    return { valid: false, error: 'Missing version' }
  }

  if (!snapshot.documents || !Array.isArray(snapshot.documents)) {
    return { valid: false, error: 'Invalid documents array' }
  }

  if (!snapshot.chunks || !Array.isArray(snapshot.chunks)) {
    return { valid: false, error: 'Invalid chunks array' }
  }

  if (!snapshot.manifest) {
    return { valid: false, error: 'Missing manifest' }
  }

  if (snapshot.version !== '1.0.0') {
    return { valid: false, error: `Version mismatch: ${snapshot.version}` }
  }

  return { valid: true }
}
