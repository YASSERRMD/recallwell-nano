import { describe, it, expect } from 'vitest'
import { buildGroundedPrompt } from '../answer/prompt'
import { formatCitation, parseCitations } from '../answer/citations'
import { isNotInKnowledgeBase } from '../answer/guard'
import type { Chunk } from '../db/types'

function createChunk(docId: number, ordinal: number, text: string): Chunk {
  return {
    id: 1,
    docId,
    ordinal,
    text,
    headingPath: '',
    tokenEstimate: text.split(/\s+/).length,
    summary: '',
    keywords: '',
  }
}

describe('buildGroundedPrompt', () => {
  it('should build prompt with context', () => {
    const chunks = [createChunk(1, 0, 'Test content')]
    const prompt = buildGroundedPrompt(chunks, 'What is this?')
    expect(prompt).toContain('[docId:1#0]')
    expect(prompt).toContain('What is this?')
  })
})

describe('formatCitation', () => {
  it('should format citation', () => {
    expect(formatCitation(1, 0)).toBe('1#0')
  })
})

describe('parseCitations', () => {
  it('should parse citations from text', () => {
    const citations = parseCitations('Answer 1#0 and 2#1')
    expect(citations).toEqual([
      { docId: 1, ordinal: 0 },
      { docId: 2, ordinal: 1 },
    ])
  })
})

describe('isNotInKnowledgeBase', () => {
  it('should detect refusal responses', () => {
    expect(isNotInKnowledgeBase("I don't have enough information")).toBe(true)
    expect(isNotInKnowledgeBase('Not found in the context')).toBe(true)
  })

  it('should not flag normal answers', () => {
    expect(isNotInKnowledgeBase('The answer is 42')).toBe(false)
  })
})
