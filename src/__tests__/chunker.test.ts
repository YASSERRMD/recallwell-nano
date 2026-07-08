import { describe, it, expect } from 'vitest'
import { estimateTokens } from '../ingest/chunker/tokenEstimator'
import { chunkContent } from '../ingest/chunker/splitter'
import type { ParsedContent } from '../ingest/parsers'

describe('estimateTokens', () => {
  it('should estimate token count', () => {
    const tokens = estimateTokens('hello world test')
    expect(tokens).toBeGreaterThan(0)
  })
})

describe('chunkContent', () => {
  it('should chunk text into pieces', () => {
    const content: ParsedContent = {
      text: 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.',
      headings: [],
    }

    const chunks = chunkContent(content, 1)
    expect(chunks.length).toBeGreaterThan(0)
    chunks.forEach((chunk) => {
      expect(chunk.docId).toBe(1)
      expect(chunk.ordinal).toBeGreaterThanOrEqual(0)
    })
  })

  it('should preserve heading path', () => {
    const content: ParsedContent = {
      text: '# Heading\n\nContent under heading.',
      headings: ['Heading'],
    }

    const chunks = chunkContent(content, 1)
    expect(chunks[0].headingPath).toBe('Heading')
  })

  it('should assign sequential ordinals', () => {
    const longText = Array(20).fill('This is a paragraph with enough words to create chunks.').join('\n\n')
    const content: ParsedContent = {
      text: longText,
      headings: [],
    }

    const chunks = chunkContent(content, 1)
    const ordinals = chunks.map((c) => c.ordinal)
    const uniqueOrdinals = [...new Set(ordinals)]
    expect(uniqueOrdinals.length).toBe(chunks.length)
  })
})
