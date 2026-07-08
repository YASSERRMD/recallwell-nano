export interface Document {
  id?: number
  title: string
  source: string
  mime: string
  ingestedAt: number
  hash: string
}

export interface Chunk {
  id?: number
  docId: number
  ordinal: number
  text: string
  headingPath: string
  tokenEstimate: number
  summary: string
  keywords: string
}
