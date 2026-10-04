export class BodyLimitError extends Error {
  constructor(public readonly status: 408 | 413, message: string) {
    super(message)
    this.name = 'BodyLimitError'
  }
}

// Count actual streamed bytes: Content-Length may be absent or inaccurate.
export async function readLimitedBody(
  message: { headers: Headers; body: ReadableStream<Uint8Array> | null },
  maxBytes: number,
  timeoutMs = 10000
): Promise<ArrayBuffer> {
  const declaredLength = Number(message.headers.get('content-length'))
  if (declaredLength > maxBytes) {
    await message.body?.cancel()
    throw new BodyLimitError(413, '请求内容过大。')
  }
  if (!message.body) return new ArrayBuffer(0)
  const reader = message.body.getReader()
  let timeout: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new BodyLimitError(408, '请求读取超时。')), timeoutMs)
  })
  const chunks: Uint8Array[] = []
  let size = 0
  let finished = false
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline])
      if (done) { finished = true; break }
      size += value.byteLength
      if (size > maxBytes) {
        throw new BodyLimitError(413, '请求内容过大。')
      }
      chunks.push(value)
    }
    const output = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.byteLength }
    return output.buffer
  } finally {
    clearTimeout(timeout)
    try {
      if (!finished) await reader.cancel()
    } finally {
      reader.releaseLock()
    }
  }
}
