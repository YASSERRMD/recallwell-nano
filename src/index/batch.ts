import type { NanoSession } from '../nano/session'
import { promptWithTimeout } from '../nano/session'
import type { Chunk } from '../db/types'
import type { IndexCard } from './generator'

export interface ProgressCallback {
  (current: number, total: number): void
}

export async function generateIndexCardsBatch(
  session: NanoSession,
  chunks: Chunk[],
  onProgress?: ProgressCallback,
): Promise<Map<number, IndexCard>> {
  const results = new Map<number, IndexCard>()

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    if (chunk.id === undefined) continue

    try {
      const prompt = buildIndexCardPromptForChunk(chunk.text)
      const result = await promptWithTimeout(session, prompt, 30000)
      const cleaned = result.replace(/```json\n?|\n?```/g, '').trim()
      const card = JSON.parse(cleaned) as IndexCard
      results.set(chunk.id, card)
    } catch (e) {
      console.error(`Failed to generate index card for chunk ${chunk.id}:`, e)
    }

    onProgress?.(i + 1, chunks.length)
  }

  return results
}

function buildIndexCardPromptForChunk(text: string): string {
  return `You are a knowledge base indexer. Given the following text chunk, generate an index card.

Text chunk:
${text.slice(0, 2000)}

Respond with valid JSON only. No markdown, no explanation.
JSON format:
{
  "summary": "A concise 1-2 sentence summary of the chunk",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`
}
