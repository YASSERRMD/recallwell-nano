export function formatCitation(docId: number, ordinal: number): string {
  return `${docId}#${ordinal}`
}

export function parseCitations(text: string): Array<{ docId: number; ordinal: number }> {
  const citationRegex = /(\d+)#(\d+)/g
  const citations: Array<{ docId: number; ordinal: number }> = []
  let match

  while ((match = citationRegex.exec(text)) !== null) {
    citations.push({
      docId: parseInt(match[1], 10),
      ordinal: parseInt(match[2], 10),
    })
  }

  return citations
}
