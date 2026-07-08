import { describe, it, expect } from 'vitest'
import { createMockSessionWithJSON } from '../nano/mock'
import { generateIndexCard } from '../index/generator'
import { extractKeywords, extractSummary } from '../index/fallback'

describe('generateIndexCard', () => {
  it('should generate index card from text', async () => {
    const session = createMockSessionWithJSON({
      summary: 'Test summary',
      keywords: ['test', 'keyword'],
    })

    const card = await generateIndexCard(session, 'Some text')
    expect(card.summary).toBe('Test summary')
    expect(card.keywords).toEqual(['test', 'keyword'])
  })
})

describe('extractKeywords', () => {
  it('should extract keywords from text', () => {
    const keywords = extractKeywords('This is a test document about testing and documents')
    expect(keywords.length).toBeGreaterThan(0)
    expect(keywords).toContain('test')
    expect(keywords).toContain('document')
  })

  it('should filter stopwords', () => {
    const keywords = extractKeywords('the and or but in on at to for')
    expect(keywords.length).toBe(0)
  })
})

describe('extractSummary', () => {
  it('should extract first sentence as summary', () => {
    const summary = extractSummary('First sentence. Second sentence.')
    expect(summary).toContain('First sentence')
  })
})
