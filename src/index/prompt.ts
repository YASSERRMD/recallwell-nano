export function buildIndexCardPrompt(text: string): string {
  return `Analyze the following text and provide:
1. A one-line summary (max 30 words)
2. A comma-separated list of 5-10 keywords

Text:
${text}

Respond with JSON:
{
  "summary": "one line summary",
  "keywords": ["keyword1", "keyword2", ...]
}`
}
