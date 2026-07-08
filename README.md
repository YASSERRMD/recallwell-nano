# Recallwell Nano

On-device, vectorless knowledge-base Q&A in the browser.

## Overview

Recallwell Nano is a fully client-side knowledge base that runs entirely in your browser. It uses Chrome's built-in Gemini Nano (Prompt API) to answer questions about your documents without any backend server or network calls at runtime.

### Key Principles

- **Offline-first**: Works without internet after initial load
- **Vectorless**: Uses LLM-driven relevance over plain text, not vector embeddings
- **Zero backend**: All processing happens in the browser
- **Private**: Your data never leaves your device

## Tech Stack

- Vite + TypeScript
- PWA (Progressive Web App)
- Dexie (IndexedDB wrapper)
- Chrome built-in AI (Gemini Nano Prompt API)
- pdf.js for PDF parsing
- Vitest for testing

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Browser Requirements

- Chrome 131+ with built-in AI enabled
- Visit `chrome://flags/#enable-built-in-ai` to enable Gemini Nano

## License

MIT
