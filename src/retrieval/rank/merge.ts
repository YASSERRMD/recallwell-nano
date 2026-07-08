export function mergeRankings(...rankings: number[][]): number[] {
  const seen = new Set<number>()
  const merged: number[] = []

  for (const ranking of rankings) {
    for (const id of ranking) {
      if (!seen.has(id)) {
        seen.add(id)
        merged.push(id)
      }
    }
  }

  return merged
}
