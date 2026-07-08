import type { NanoSession } from './session'

export function createMockSession(responses: string[] = []): NanoSession {
  let callCount = 0

  return {
    prompt: async (_input: string) => {
      const response = responses[callCount % responses.length] || 'Mock response'
      callCount++
      return response
    },
    destroy: () => {},
  }
}

export function createMockSessionWithJSON<T>(data: T): NanoSession {
  return {
    prompt: async () => JSON.stringify(data),
    destroy: () => {},
  }
}
