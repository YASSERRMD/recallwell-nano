# Browser Requirements

## Chrome Built-in AI

Recallwell Nano uses Chrome's built-in Gemini Nano (Prompt API) for AI-powered features.

### Requirements

- **Browser**: Google Chrome 131 or later
- **Platform**: Windows, macOS, or Linux
- **Hardware**: Device with sufficient RAM (4GB+ recommended)

### Enable Built-in AI

1. Open Chrome
2. Visit `chrome://flags/#enable-built-in-ai`
3. Find "Built-in AI" and set to "Enabled"
4. Restart Chrome

### Verify AI is Available

1. Open Chrome DevTools (F12)
2. Run: `await window.ai.languageModel.capabilities()`
3. Should return `{ available: true }`

## Fallback Mode

If Chrome's built-in AI is not available:

- App runs in keyword-only fallback mode
- No AI-powered ranking or answers
- Basic keyword matching still works

## Offline Usage

- App works offline after initial load
- All data stored locally in IndexedDB
- No network calls at runtime

## Supported File Types

- `.txt` - Plain text
- `.md` - Markdown
- `.html` - HTML
- `.pdf` - PDF documents
