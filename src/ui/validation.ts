const SUPPORTED_TYPES: Record<string, string[]> = {
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'text/x-markdown': ['.md'],
  'text/html': ['.html'],
  'application/pdf': ['.pdf'],
}

export interface ValidationResult {
  valid: File[]
  invalid: Array<{ file: File; reason: string }>
}

export function validateFiles(files: File[]): ValidationResult {
  const valid: File[] = []
  const invalid: Array<{ file: File; reason: string }> = []

  for (const file of files) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    const supportedExts = SUPPORTED_TYPES[file.type] || []

    if (supportedExts.includes(ext) || Object.values(SUPPORTED_TYPES).flat().includes(ext)) {
      valid.push(file)
    } else {
      invalid.push({ file, reason: `Unsupported file type: ${file.type || ext}` })
    }
  }

  return { valid, invalid }
}
