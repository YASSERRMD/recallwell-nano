import type { Chunk } from '../../db/types'
import { estimateTokens } from './tokenEstimator'
import type { ParsedContent } from '../parsers'

const MAX_CHUNK_TOKENS = 500
const OVERLAP_TOKENS = 50

export function chunkContent(
  content: ParsedContent,
  docId: number,
): Omit<Chunk, 'id'>[] {
  const chunks: Omit<Chunk, 'id'>[] = []
  const paragraphs = content.text.split(/\n\s*\n/).filter(Boolean)

  let currentChunk = ''
  let currentHeadingPath = ''
  let ordinal = 0
  let lastChunkText = ''

  for (const paragraph of paragraphs) {
    const headingMatch = paragraph.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      if (currentChunk.trim()) {
        chunks.push(createChunk(docId, ordinal++, currentChunk, currentHeadingPath))
        lastChunkText = currentChunk
        currentChunk = ''
      }
      currentHeadingPath = headingMatch[2].trim()
    }

    const testChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph
    const tokenEst = estimateTokens(testChunk)

    if (tokenEst > MAX_CHUNK_TOKENS && currentChunk.trim()) {
      chunks.push(createChunk(docId, ordinal++, currentChunk, currentHeadingPath))
      lastChunkText = currentChunk
      const overlapText = getOverlapText(lastChunkText)
      currentChunk = overlapText ? `${overlapText}\n\n${paragraph}` : paragraph
    } else {
      currentChunk = testChunk
    }
  }

  if (currentChunk.trim()) {
    chunks.push(createChunk(docId, ordinal++, currentChunk, currentHeadingPath))
  }

  return chunks
}

function getOverlapText(text: string): string {
  const words = text.split(/\s+/)
  const overlapWords: string[] = []
  let tokenCount = 0

  for (let i = words.length - 1; i >= 0 && tokenCount < OVERLAP_TOKENS; i--) {
    overlapWords.unshift(words[i])
    tokenCount++
  }

  return overlapWords.join(' ')
}

function createChunk(
  docId: number,
  ordinal: number,
  text: string,
  headingPath: string,
): Omit<Chunk, 'id'> {
  return {
    docId,
    ordinal,
    text: text.trim(),
    headingPath,
    tokenEstimate: estimateTokens(text),
    summary: '',
    keywords: '',
  }
}
