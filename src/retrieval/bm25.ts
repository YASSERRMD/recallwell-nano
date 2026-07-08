import type { InvertedIndex } from './invertedIndex'
import { tokenize } from './tokenizer'

const K1 = 1.5
const B = 0.75

export function bm25Score(
  index: InvertedIndex,
  query: string,
  chunkId: number,
): number {
  const queryTokens = tokenize(query)
  const chunk = index.chunkDocs.get(chunkId)
  if (!chunk) return 0

  const docLength = chunk.text.split(/\s+/).length
  const avgDocLength = calculateAvgDocLength(index)
  const numDocs = index.chunkDocs.size

  let score = 0

  for (const token of queryTokens) {
    const docFreq = index.terms.get(token)
    if (!docFreq) continue

    const tf = docFreq.get(chunkId) || 0
    if (tf === 0) continue

    const df = docFreq.size
    const idf = Math.log((numDocs - df + 0.5) / (df + 0.5) + 1)

    const tfNorm = (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * (docLength / avgDocLength)))

    score += idf * tfNorm
  }

  return score
}

function calculateAvgDocLength(index: InvertedIndex): number {
  let totalLength = 0
  for (const chunk of index.chunkDocs.values()) {
    totalLength += chunk.text.split(/\s+/).length
  }
  return totalLength / index.chunkDocs.size || 1
}
