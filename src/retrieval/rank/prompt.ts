export interface RankCard {
  id: number
  summary: string
  keywords: string
}

export function buildRankPrompt(cards: RankCard[], question: string): string {
  const cardList = cards
    .map((c) => `[${c.id}] Summary: ${c.summary} | Keywords: ${c.keywords}`)
    .join('\n')

  return `Given a question and a list of index cards (chunk id, summary, keywords),
rank the cards by relevance to the question.
Return the top-k most relevant chunk ids as a JSON array.

Question: ${question}

Index Cards:
${cardList}

Return JSON array of chunk ids ordered by relevance (most relevant first).`
}
