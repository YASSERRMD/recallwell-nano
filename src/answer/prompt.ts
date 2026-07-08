import type { Chunk } from '../db/types'

export function buildGroundedPrompt(chunks: Chunk[], question: string): string {
  const context = chunks
    .map((c) => `[docId:${c.docId}#${c.ordinal}] ${c.text}`)
    .join('\n\n')

  return `You are a helpful assistant. Answer the question using ONLY the provided context chunks. 
If the answer cannot be found in the context, say "I don't have enough information to answer this question."

Context chunks:
${context}

Question: ${question}

Answer with citations in format docId#ordinal.`
}
