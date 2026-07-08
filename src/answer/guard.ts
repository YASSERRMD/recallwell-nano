export function isNotInKnowledgeBase(response: string): boolean {
  const lower = response.toLowerCase()
  return (
    lower.includes('i don\'t have enough information') ||
    lower.includes('not found in the context') ||
    lower.includes('cannot answer') ||
    lower.includes('no information available')
  )
}
