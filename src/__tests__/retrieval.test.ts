import { describe, it, expect } from 'vitest'
import { tokenize } from '../retrieval/tokenizer'
import { buildInvertedIndex } from '../retrieval/invertedIndex'
import { bm25Score } from '../retrieval/bm25'
import { shortlistCandidates } from '../retrieval/shortlist'
import type { Chunk } from '../db/types'

function createChunk(id: number, text: string, summary: string, keywords: string): Chunk {
  return {
    id,
    docId: 1,
    ordinal: id,
    text,
    headingPath: '',
    tokenEstimate: text.split(/\s+/).length,
    summary,
    keywords,
  }
}

describe('tokenize', () => {
  it('should tokenize text', () => {
    const tokens = tokenize('Hello World Test')
    expect(tokens).toContain('hello')
    expect(tokens).toContain('world')
    expect(tokens).toContain('test')
  })

  it('should filter stopwords', () => {
    const tokens = tokenize('the and or but')
    expect(tokens.length).toBe(0)
  })
})

describe('buildInvertedIndex', () => {
  it('should build index from chunks', () => {
    const chunks = [
      createChunk(1, 'Text 1', 'Summary 1', 'keyword1, keyword2'),
      createChunk(2, 'Text 2', 'Summary 2', 'keyword2, keyword3'),
    ]

    const index = buildInvertedIndex(chunks)
    expect(index.terms.size).toBeGreaterThan(0)
    expect(index.chunkDocs.size).toBe(2)
  })
})

describe('bm25Score', () => {
  it('should score relevant chunks higher', () => {
    const chunks = [
      createChunk(1, 'Test document about cats', 'Cats are pets', 'cats, pets'),
      createChunk(2, 'Test document about dogs', 'Dogs are pets', 'dogs, pets'),
    ]

    const index = buildInvertedIndex(chunks)
    const score1 = bm25Score(index, 'cats', 1)
    const score2 = bm25Score(index, 'cats', 2)

    expect(score1).toBeGreaterThan(score2)
  })
})

describe('shortlistCandidates', () => {
  it('should return relevant chunk ids', () => {
    const chunks = [
      createChunk(1, 'JavaScript programming', 'JS is a language', 'javascript, programming'),
      createChunk(2, 'Python programming', 'Python is a language', 'python, programming'),
      createChunk(3, 'Cooking recipes', 'How to cook', 'cooking, recipes'),
    ]

    const ids = shortlistCandidates(chunks, 'javascript')
    expect(ids).toContain(1)
  })
})
