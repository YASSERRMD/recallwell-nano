import type { Chunk } from '../../db/types'
import { estimateTokens } from './tokenEstimator'
import type { ParsedContent } from '../parsers'

const MIN_CHUNK_TOKENS = 300
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

  for (const paragraph of paragraphs) {
    const headingMatch = paragraph.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      if (currentChunk.trim()) {
        chunks.push(createChunk(docId, ordinal++, currentChunk, currentHeadingPath))
        currentChunk = ''
      }
      currentHeadingPath = headingMatch[2].trim()
    }

    const testChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph
    const tokenEst = estimateTokens(testChunk)

    if (tokenEst > MAX_CHUNK_TOKENS && currentChunk.trim()) {
      chunks.push(createChunk(docId, ordinal++, currentChunk, currentHeadingPath))
      currentChunk = paragraph
    } else {
      currentChunk = testChunk
    }
  }

  if (currentChunk.trim()) {
    chunks.push(createChunk(docId, ordinal++, currentChunk, currentHeadingPath))
  }

  return chunks
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
