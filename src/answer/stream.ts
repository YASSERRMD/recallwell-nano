import type { NanoSession } from '../nano/session'
import type { Chunk } from '../db/types'
import { buildGroundedPrompt } from './prompt'

export interface StreamCallbacks {
  onToken: (token: string) => void
  onDone: (fullText: string) => void
  onError: (error: Error) => void
}

export async function streamAnswer(
  session: NanoSession,
  chunks: Chunk[],
  question: string,
  callbacks: StreamCallbacks,
): Promise<void> {
  const prompt = buildGroundedPrompt(chunks, question)

  try {
    const result = await session.prompt(prompt)
    callbacks.onDone(result)
  } catch (e) {
    callbacks.onError(e instanceof Error ? e : new Error(String(e)))
  }
}
