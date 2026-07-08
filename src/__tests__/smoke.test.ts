import { describe, it, expect } from 'vitest'

describe('Smoke test', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should verify project structure', () => {
    expect(true).toBe(true)
  })
})
