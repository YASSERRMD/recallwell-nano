# Usage Guide

## Ingesting Documents

### Supported Formats

- **Plain Text** (.txt) - Raw text files
- **Markdown** (.md) - Markdown with heading hierarchy preserved
- **HTML** (.html) - Web pages with boilerplate stripped
- **PDF** (.pdf) - PDF documents via pdf.js

### Ingestion Process

1. **Drag and Drop**: Drag files onto the dropzone area
2. **File Selection**: Click "Select files" button to browse
3. **Validation**: Files are validated for supported types
4. **Processing**:
   - Parsing: Extract text and headings
   - Chunking: Split into 300-500 token chunks with heading context
   - Indexing: Generate summary and keywords via Gemini Nano
5. **Storage**: Save to IndexedDB (Dexie)

## Asking Questions

1. Type your question in the input field
2. Click "Ask" or press Enter
3. View the grounded answer with citations
4. Click citation chips to view source chunks

### Answer Quality

- Answers are grounded in your documents only
- Citations show which chunks were used
- Refusal when information is not in the knowledge base

## Publishing Knowledge Base

### Export

1. Click "Export Knowledge Base"
2. Download `.rwkb.json.gz` snapshot
3. Share the file with others

### Import

1. Open the app on another device
2. Import the `.rwkb.json.gz` file
3. Q&A is available in read-only mode

## Browser Requirements

- Chrome 131+ with built-in AI enabled
- Visit `chrome://flags/#enable-built-in-ai` to enable Gemini Nano

## Offline Usage

- App works offline after initial load
- All data stored locally in IndexedDB
- No network calls at runtime
