export interface ParsedContent {
  text: string
  headings: string[]
}

export async function parseTxt(file: File): Promise<ParsedContent> {
  const text = await file.text()
  return {
    text,
    headings: [],
  }
}
