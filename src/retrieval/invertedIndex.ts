import type { Chunk } from '../db/types'
import { tokenize } from './tokenizer'

export interface InvertedIndex {
  terms: Map<string, Map<number, number>>
  chunkDocs: Map<number, Chunk>
}

export function buildInvertedIndex(chunks: Chunk[]): InvertedIndex {
  const terms = new Map<string, Map<number, number>>()
  const chunkDocs = new Map<number, Chunk>()

  for (const chunk of chunks) {
    if (chunk.id === undefined) continue
    chunkDocs.set(chunk.id, chunk)

    const text = `${chunk.text} ${chunk.summary} ${chunk.keywords}`
    const tokens = tokenize(text)

    for (const token of tokens) {
      if (!terms.has(token)) {
        terms.set(token, new Map())
      }
      const docFreq = terms.get(token)!
      docFreq.set(chunk.id, (docFreq.get(chunk.id) || 0) + 1)
    }
  }

  return { terms, chunkDocs }
}
