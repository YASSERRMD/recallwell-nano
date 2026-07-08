import type { ParsedContent } from './txt'

export async function parseHtml(file: File): Promise<ParsedContent> {
  const html = await file.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const scriptTags = doc.querySelectorAll('script, style, nav, footer, header')
  scriptTags.forEach((el) => el.remove())

  const headings: string[] = []
  const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
  headingElements.forEach((el) => {
    headings.push(el.textContent?.trim() || '')
  })

  const text = doc.body?.textContent || ''

  return {
    text,
    headings,
  }
}
