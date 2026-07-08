# Recallwell Nano

On-device, vectorless knowledge-base Q&A in the browser.

## Overview

Recallwell Nano is a fully client-side knowledge base that runs entirely in your browser. It uses Chrome's built-in Gemini Nano (Prompt API) to answer questions about your documents without any backend server or network calls at runtime.

### Key Principles

- **Offline-first**: Works without internet after initial load
- **Vectorless**: Uses LLM-driven relevance over plain text, not vector embeddings
- **Zero backend**: All processing happens in the browser
- **Private**: Your data never leaves your device

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (PWA)                          │
├─────────────────────────────────────────────────────────────┤
│  Ingestion Pipeline                                         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐ │
│  │ Parsers │ -> │Chunking │ -> │Index    │ -> │Persist  │ │
│  │(txt/md/ │    │(heading │    │Cards    │    │to DB    │ │
│  │ html/pdf│    │ +window)│    │(Nano)   │    │(Dexie)  │ │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Retrieval Pipeline                                         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐ │
│  │ BM25    │ -> │LLM Rank │ -> │Grounded │ -> │Answer   │ │
│  │(coarse  │    │(Nano)   │    │Prompt   │    │(cited)  │ │
│  │ filter) │    │         │    │         │    │         │ │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Storage: IndexedDB (Dexie)                                 │
│  AI: Chrome Built-in Gemini Nano (Prompt API)               │
│  Zero network calls at runtime                              │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- Vite + TypeScript
- PWA (Progressive Web App)
- Dexie (IndexedDB wrapper)
- Chrome built-in AI (Gemini Nano Prompt API)
- pdf.js for PDF parsing
- Vitest + Playwright for testing

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

# Run Playwright tests
npx playwright test
```

## Browser Requirements

- Chrome 131+ with built-in AI enabled
- Visit `chrome://flags/#enable-built-in-ai` to enable Gemini Nano

## Usage

### Ingest Documents

1. Open the app in Chrome
2. Drag and drop files (txt, md, html, pdf) onto the dropzone
3. Watch the ingestion pipeline process your files

### Ask Questions

1. Type a question in the input field
2. Click "Ask" or press Enter
3. View the grounded answer with citations

### Export/Import Knowledge Base

1. Click "Export Knowledge Base" to download a `.rwkb.json.gz` snapshot
2. Import snapshots on other devices for read-only Q&A

## Privacy

- All processing happens in your browser
- No data leaves your device
- No backend server
- No network calls at runtime (after initial load)

## License

MIT
