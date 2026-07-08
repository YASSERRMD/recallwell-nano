import { describe, it, expect } from 'vitest'
import { parseTxt } from '../ingest/parsers/txt'
import { parseMarkdown } from '../ingest/parsers/md'
import { parseHtml } from '../ingest/parsers/html'
import { computeHash } from '../ingest/hash'

function createFile(name: string, content: string, type: string): File {
  return new File([content], name, { type })
}

describe('parseTxt', () => {
  it('should parse plain text', async () => {
    const file = createFile('test.txt', 'Hello World\nSecond line', 'text/plain')
    const result = await parseTxt(file)

    expect(result.text).toBe('Hello World\nSecond line')
    expect(result.headings).toEqual([])
  })
})

describe('parseMarkdown', () => {
  it('should extract headings', async () => {
    const content = '# Title\n\nText\n\n## Subtitle\n\nMore text'
    const file = createFile('test.md', content, 'text/markdown')
    const result = await parseMarkdown(file)

    expect(result.headings).toEqual(['Title', 'Subtitle'])
    expect(result.text).toContain('# Title')
  })
})

describe('parseHtml', () => {
  it('should extract text and headings', async () => {
    const html = '<html><body><h1>Title</h1><p>Content</p></body></html>'
    const file = createFile('test.html', html, 'text/html')
    const result = await parseHtml(file)

    expect(result.headings).toEqual(['Title'])
    expect(result.text).toContain('Title')
    expect(result.text).toContain('Content')
  })

  it('should strip script tags', async () => {
    const html = '<html><body><script>var x=1;</script><p>Text</p></body></html>'
    const file = createFile('test.html', html, 'text/html')
    const result = await parseHtml(file)

    expect(result.text).not.toContain('var x=1')
  })
})

describe('computeHash', () => {
  it('should compute SHA-256 hash', async () => {
    const hash = await computeHash('hello')
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[a-f0-9]+$/)
  })

  it('should produce same hash for same input', async () => {
    const h1 = await computeHash('test')
    const h2 = await computeHash('test')
    expect(h1).toBe(h2)
  })
})
