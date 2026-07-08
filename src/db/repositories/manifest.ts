import { db } from '../index'
import type { Manifest } from '../types'

export async function upsertManifest(manifest: Omit<Manifest, 'id'>): Promise<void> {
  await db.manifest.clear()
  await db.manifest.add(manifest as Manifest)
}

export async function getManifest(): Promise<Manifest | undefined> {
  return db.manifest.toCollection().first()
}
