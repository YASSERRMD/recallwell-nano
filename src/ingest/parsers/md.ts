import type { ParsedContent } from './txt'

export async function parseMarkdown(file: File): Promise<ParsedContent> {
  const text = await file.text()
  const headings: string[] = []
  const lines = text.split('\n')

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/)
    if (match) {
      headings.push(match[2].trim())
    }
  }

  return {
    text,
    headings,
  }
}
