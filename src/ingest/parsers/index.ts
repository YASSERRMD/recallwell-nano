import type { ParsedContent } from './txt'
import { parseTxt } from './txt'
import { parseMarkdown } from './md'
import { parseHtml } from './html'
import { parsePdf } from './pdf'

export type { ParsedContent }

export async function parse(file: File): Promise<ParsedContent> {
  const mime = file.type

  switch (mime) {
    case 'text/plain':
      return parseTxt(file)
    case 'text/markdown':
    case 'text/x-markdown':
      return parseMarkdown(file)
    case 'text/html':
      return parseHtml(file)
    case 'application/pdf':
      return parsePdf(file)
    default:
      if (file.name.endsWith('.md')) {
        return parseMarkdown(file)
      }
      if (file.name.endsWith('.html')) {
        return parseHtml(file)
      }
      if (file.name.endsWith('.txt')) {
        return parseTxt(file)
      }
      throw new Error(`Unsupported file type: ${mime}`)
  }
}
