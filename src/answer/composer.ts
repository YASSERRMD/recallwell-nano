import type { Chunk } from '../db/types'

export function composeAnswer(chunks: Chunk[], question: string): string {
  if (chunks.length === 0) {
    return 'I could not find relevant information in your documents to answer this question.'
  }

  const relevantTexts = chunks
    .filter((c) => c.text.trim().length > 0)
    .slice(0, 5)
    .map((c) => c.text.trim())

  if (relevantTexts.length === 0) {
    return 'I could not find relevant information in your documents to answer this question.'
  }

  const combined = relevantTexts.join('\n\n')

  const sentences = combined
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 10)

  const questionWords = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)

  const scored = sentences.map((s) => {
    const lower = s.toLowerCase()
    let score = 0
    for (const word of questionWords) {
      if (lower.includes(word)) score += 2
    }
    if (lower.includes('?')) score -= 1
    return { sentence: s.trim(), score }
  })

  scored.sort((a, b) => b.score - a.score)

  const topSentences = scored
    .slice(0, 5)
    .map((s) => s.sentence)

  if (topSentences.length === 0) {
    return relevantTexts[0].slice(0, 500)
  }

  const answer = topSentences.join(' ')

  return answer
}

export function composeAnswerWithCitations(chunks: Chunk[], question: string): { text: string; citations: Array<{ docId: number; ordinal: number }> } {
  if (chunks.length === 0) {
    return { text: 'I could not find relevant information in your documents to answer this question.', citations: [] }
  }

  const relevantChunks = chunks
    .filter((c) => c.text.trim().length > 0)
    .slice(0, 5)

  const questionWords = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)

  const scoredChunks = relevantChunks.map((c) => {
    const lower = c.text.toLowerCase()
    let score = 0
    for (const word of questionWords) {
      if (lower.includes(word)) score += 2
    }
    if (c.summary) {
      const sumLower = c.summary.toLowerCase()
      for (const word of questionWords) {
        if (sumLower.includes(word)) score += 1
      }
    }
    return { chunk: c, score }
  })

  scoredChunks.sort((a, b) => b.score - a.score)

  const topChunks = scoredChunks.slice(0, 3)

  const answerParts = topChunks.map((sc) => {
    const text = sc.chunk.text.trim()
    const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 10)
    const relevant = sentences.slice(0, 3).join(' ')
    return relevant || text.slice(0, 300)
  })

  const citations = topChunks.map((sc) => ({
    docId: sc.chunk.docId,
    ordinal: sc.chunk.ordinal,
  }))

  return {
    text: answerParts.join('\n\n'),
    citations,
  }
}
