import type { RWKBSnapshot } from '../export/serialize'

export async function readRWKBFile(file: File): Promise<RWKBSnapshot> {
  let text: string

  if (file.name.endsWith('.gz')) {
    const arrayBuffer = await file.arrayBuffer()
    const stream = new Blob([arrayBuffer]).stream().pipeThrough(new DecompressionStream('gzip'))
    text = await new Response(stream).text()
  } else {
    text = await file.text()
  }

  return JSON.parse(text) as RWKBSnapshot
}
