import type { NanoSession } from './session'

export interface NanoState {
  available: boolean
  session: NanoSession | null
  error: string | null
}

export function createUnavailableState(error: string): NanoState {
  return {
    available: false,
    session: null,
    error,
  }
}

export function createAvailableState(session: NanoSession): NanoState {
  return {
    available: true,
    session,
    error: null,
  }
}
