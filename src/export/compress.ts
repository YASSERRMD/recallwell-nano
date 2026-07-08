export async function compressData(data: string): Promise<Blob> {
  const encoder = new TextEncoder()
  const stream = new Blob([encoder.encode(data)]).stream()

  const compressedStream = stream.pipeThrough(
    new CompressionStream('gzip'),
  )

  return new Response(compressedStream).blob()
}
