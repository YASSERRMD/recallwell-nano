import { describe, it, expect } from 'vitest'
import { createMockSession, createMockSessionWithJSON } from '../nano/mock'
import { promptWithTimeout } from '../nano/prompt'
import { promptJSON } from '../nano/structured'
import { createUnavailableState, createAvailableState } from '../nano/state'

describe('NanoSession mock', () => {
  it('should return mock responses', async () => {
    const session = createMockSession(['Hello', 'World'])
    const result = await session.prompt('test')
    expect(result).toBe('Hello')
  })

  it('should cycle through responses', async () => {
    const session = createMockSession(['A', 'B'])
    const r1 = await session.prompt('test')
    const r2 = await session.prompt('test')
    expect(r1).toBe('A')
    expect(r2).toBe('B')
  })
})

describe('promptWithTimeout', () => {
  it('should return response', async () => {
    const session = createMockSession(['OK'])
    const result = await promptWithTimeout(session, 'test')
    expect(result).toBe('OK')
  })
})

describe('promptJSON', () => {
  it('should parse JSON response', async () => {
    const session = createMockSessionWithJSON({ key: 'value' })
    const result = await promptJSON<{ key: string }>(session, 'test')
    expect(result.key).toBe('value')
  })

  it('should throw on invalid JSON', async () => {
    const session = createMockSession(['not json'])
    await expect(promptJSON(session, 'test')).rejects.toThrow('Failed to parse JSON')
  })
})

describe('NanoState', () => {
  it('should create unavailable state', () => {
    const state = createUnavailableState('Not available')
    expect(state.available).toBe(false)
    expect(state.error).toBe('Not available')
  })

  it('should create available state', () => {
    const session = createMockSession()
    const state = createAvailableState(session)
    expect(state.available).toBe(true)
    expect(state.session).toBe(session)
  })
})
