import { describe, it, expect } from 'vitest'
import { createMockSessionWithJSON } from '../nano/mock'
import { buildRankPrompt, type RankCard } from '../retrieval/rank/prompt'
import { batchCards } from '../retrieval/rank/batch'
import { rankWithLLM } from '../retrieval/rank/ranker'
import { mergeRankings } from '../retrieval/rank/merge'

const cards: RankCard[] = [
  { id: 1, summary: 'JavaScript basics', keywords: 'javascript, programming' },
  { id: 2, summary: 'Python basics', keywords: 'python, programming' },
  { id: 3, summary: 'Cooking recipes', keywords: 'cooking, food' },
]

describe('buildRankPrompt', () => {
  it('should build prompt with cards and question', () => {
    const prompt = buildRankPrompt(cards, 'What is JavaScript?')
    expect(prompt).toContain('What is JavaScript?')
    expect(prompt).toContain('[1]')
    expect(prompt).toContain('[2]')
  })
})

describe('batchCards', () => {
  it('should batch cards', () => {
    const bigCards = Array(25)
      .fill(null)
      .map((_, i) => ({ id: i, summary: `S${i}`, keywords: `K${i}` }))
    const batches = batchCards(bigCards)
    expect(batches.length).toBe(2)
    expect(batches[0].length).toBe(20)
    expect(batches[1].length).toBe(5)
  })
})

describe('rankWithLLM', () => {
  it('should return ranked ids', async () => {
    const session = createMockSessionWithJSON([1, 3])
    const ids = await rankWithLLM(session, cards, 'test')
    expect(ids).toContain(1)
    expect(ids).toContain(3)
  })
})

describe('mergeRankings', () => {
  it('should merge and deduplicate', () => {
    const merged = mergeRankings([1, 2, 3], [2, 3, 4])
    expect(merged).toEqual([1, 2, 3, 4])
  })
})
