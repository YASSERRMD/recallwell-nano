import './style.css'
import { detectCapability } from './nano/capability'
import { createSession, type NanoSession } from './nano/session'
import { parse } from './ingest/parsers'
import { chunkContent } from './ingest/chunker/splitter'
import { generateIndexCardsBatch } from './index/batch'
import { persistIndexCards } from './index/persist'
import { extractKeywords, extractSummary } from './index/fallback'
import { listDocuments, addDocument, deleteDocument } from './db/repositories/document'
import { bulkAddChunks, getAllChunks } from './db/repositories/chunk'
import { upsertManifest, getManifest } from './db/repositories/manifest'
import { shortlistCandidates } from './retrieval/shortlist'
import { loadTopKChunks } from './answer/loadChunks'
import { buildGroundedPrompt } from './answer/prompt'
import { composeAnswerWithCitations } from './answer/composer'
import { parseCitations } from './answer/citations'
import { serializeSnapshot } from './export/serialize'
import { computeContentHash } from './export/hash'
import { compressData } from './export/compress'
import { triggerDownload } from './export/download'
import { validateFiles } from './ui/validation'

let nanoSession: NanoSession | null = null

interface ChatMessage {
  role: 'user' | 'ai'
  text: string
  citations?: Array<{ docId: number; ordinal: number }>
}

const messages: ChatMessage[] = []

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="app">
    <div class="chat-header">
      <div class="avatar">R</div>
      <div class="header-info">
        <h1>Recallwell</h1>
        <p id="status-text">Checking AI...</p>
      </div>
      <div class="status-dot" id="status-dot"></div>
    </div>
    <div id="banner-area"></div>
    <div class="stats-bar" id="stats-bar" style="display: none;">
      <span>📄 <span id="stat-docs">0</span> docs</span>
      <span>📦 <span id="stat-chunks">0</span> chunks</span>
    </div>
    <div class="chat-messages" id="chat-messages">
      <div class="empty-chat" id="empty-state">
        <div class="empty-chat-icon">💬</div>
        <h3>Ask anything</h3>
        <p>I'll search your documents and answer using AI</p>
      </div>
    </div>
    <div class="chat-input-area">
      <div class="ingest-trigger" id="ingest-trigger">
        📎 Drop files here or click to ingest
        <input type="file" id="file-input" multiple accept=".txt,.md,.html,.pdf" hidden>
      </div>
      <div id="progress-area" class="progress-mini" style="display: none;"></div>
      <div id="doc-list-area" class="doc-list-mini"></div>
      <form class="chat-input-form" id="chat-form">
        <textarea class="chat-input" id="chat-input" placeholder="Ask a question..." rows="1"></textarea>
        <button type="submit" class="send-btn" id="send-btn">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </form>
    </div>
    <div class="export-area">
      <button class="export-btn" id="export-btn">📤 Export Knowledge Base</button>
      <div id="export-msg"></div>
    </div>
  </div>
  <div id="drawer-container"></div>
`

// Elements
const chatMessages = document.querySelector('#chat-messages') as HTMLElement
const chatInput = document.querySelector('#chat-input') as HTMLTextAreaElement
const emptyState = document.querySelector('#empty-state') as HTMLElement
const bannerArea = document.querySelector('#banner-area') as HTMLElement
const statsBar = document.querySelector('#stats-bar') as HTMLElement
const ingestTrigger = document.querySelector('#ingest-trigger') as HTMLElement
const fileInput = document.querySelector('#file-input') as HTMLInputElement
const progressArea = document.querySelector('#progress-area') as HTMLElement
const docListArea = document.querySelector('#doc-list-area') as HTMLElement
const drawerContainer = document.querySelector('#drawer-container') as HTMLElement

// Auto-resize textarea
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto'
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px'
})

// File ingest
ingestTrigger.addEventListener('click', () => fileInput.click())
fileInput.addEventListener('change', () => {
  const files = Array.from(fileInput.files || [])
  if (files.length > 0) handleFiles(files)
  fileInput.value = ''
})

// Drag and drop
ingestTrigger.addEventListener('dragover', (e) => {
  e.preventDefault()
  ingestTrigger.style.borderColor = 'var(--primary)'
})

ingestTrigger.addEventListener('dragleave', () => {
  ingestTrigger.style.borderColor = ''
})

ingestTrigger.addEventListener('drop', (e) => {
  e.preventDefault()
  ingestTrigger.style.borderColor = ''
  const files = Array.from(e.dataTransfer?.files || [])
  if (files.length > 0) handleFiles(files)
})

// Chat submit — Enter sends, Shift+Enter makes newline
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
})

// Send button click
document.querySelector('#send-btn')?.addEventListener('click', () => {
  sendMessage()
})

function sendMessage() {
  const q = chatInput.value.trim()
  if (q) {
    handleAsk(q)
    chatInput.value = ''
    chatInput.style.height = 'auto'
  }
}

// Export
document.querySelector('#export-btn')?.addEventListener('click', handleExport)

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight
}

function addMessage(role: 'user' | 'ai', text: string, citations?: Array<{ docId: number; ordinal: number }>) {
  messages.push({ role, text, citations })

  if (emptyState) emptyState.remove()

  const msgEl = document.createElement('div')
  msgEl.className = `message message-${role}`

  const avatarText = role === 'user' ? 'Y' : 'R'
  let citationsHtml = ''
  if (citations && citations.length > 0) {
    citationsHtml = `
      <div class="citations-row">
        ${citations.map((c) => `<button class="citation-chip" data-doc="${c.docId}" data-ord="${c.ordinal}">${c.docId}#${c.ordinal}</button>`).join('')}
      </div>
    `
  }

  msgEl.innerHTML = `
    <div class="msg-avatar">${avatarText}</div>
    <div>
      <div class="bubble">${escapeHtml(text)}${citationsHtml}</div>
    </div>
  `

  chatMessages.appendChild(msgEl)
  scrollToBottom()

  // Citation click handlers
  msgEl.querySelectorAll('.citation-chip').forEach((chip) => {
    chip.addEventListener('click', async () => {
      const docId = parseInt(chip.getAttribute('data-doc') || '0')
      const ord = parseInt(chip.getAttribute('data-ord') || '0')
      const chunks = await getAllChunks()
      const chunk = chunks.find((c) => c.docId === docId && c.ordinal === ord)
      if (chunk) showDrawer(chunk)
    })
  })
}

function showTyping() {
  const typingEl = document.createElement('div')
  typingEl.className = 'message message-ai'
  typingEl.id = 'typing'
  typingEl.innerHTML = `
    <div class="msg-avatar">R</div>
    <div class="bubble">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `
  chatMessages.appendChild(typingEl)
  scrollToBottom()
}

function hideTyping() {
  document.querySelector('#typing')?.remove()
}

function showDrawer(chunk: { docId: number; ordinal: number; text: string }) {
  drawerContainer.innerHTML = `
    <div class="drawer-overlay" id="drawer-overlay">
      <div class="drawer">
        <div class="drawer-header">
          <span class="drawer-title">Source: Doc ${chunk.docId} #${chunk.ordinal}</span>
          <button class="drawer-close" id="close-drawer">&times;</button>
        </div>
        <div class="drawer-content">${escapeHtml(chunk.text)}</div>
      </div>
    </div>
  `
  document.querySelector('#close-drawer')?.addEventListener('click', () => { drawerContainer.innerHTML = '' })
  document.querySelector('#drawer-overlay')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'drawer-overlay') drawerContainer.innerHTML = ''
  })
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function handleAsk(question: string) {
  addMessage('user', question)
  showTyping()

  try {
    const allChunks = await getAllChunks()

    if (allChunks.length === 0) {
      hideTyping()
      addMessage('ai', 'No documents ingested yet. Drop some files using the button above to get started!')
      return
    }

    const candidateIds = shortlistCandidates(allChunks, question)
    const topKChunks = await loadTopKChunks(candidateIds.slice(0, 10))

    if (topKChunks.length === 0) {
      hideTyping()
      addMessage('ai', 'No relevant documents found. Try rephrasing your question.')
      return
    }

    let answer: string
    let citations: Array<{ docId: number; ordinal: number }> = []

    if (nanoSession) {
      const prompt = buildGroundedPrompt(topKChunks, question)
      answer = await nanoSession.prompt(prompt)
      citations = parseCitations(answer)
    } else {
      try {
        const session = await createSession()
        nanoSession = session
        const prompt = buildGroundedPrompt(topKChunks, question)
        answer = await session.prompt(prompt)
        citations = parseCitations(answer)
      } catch {
        const composed = composeAnswerWithCitations(topKChunks, question)
        answer = composed.text
        citations = composed.citations
      }
    }

    hideTyping()
    addMessage('ai', answer, citations)
  } catch (e) {
    hideTyping()
    addMessage('ai', `Error: ${e instanceof Error ? e.message : String(e)}`)
  }
}

async function handleFiles(files: File[]) {
  const { valid } = validateFiles(files)
  if (valid.length === 0) return

  progressArea.style.display = 'block'
  progressArea.innerHTML = `
    <div class="progress-item"><span class="progress-label">Parse</span><div class="progress-bar"><div class="progress-fill" id="p-parse"></div></div><span class="progress-percent" id="pp-parse">0%</span></div>
    <div class="progress-item"><span class="progress-label">Chunk</span><div class="progress-bar"><div class="progress-fill" id="p-chunk"></div></div><span class="progress-percent" id="pp-chunk">0%</span></div>
    <div class="progress-item"><span class="progress-label">Index</span><div class="progress-bar"><div class="progress-fill" id="p-index"></div></div><span class="progress-percent" id="pp-index">0%</span></div>
  `

  const setP = (id: string, pct: number) => {
    const fill = document.querySelector(`#p-${id}`) as HTMLElement
    const label = document.querySelector(`#pp-${id}`) as HTMLElement
    if (fill) fill.style.width = `${pct}%`
    if (label) label.textContent = `${pct}%`
  }

  let totalChunks = 0

  for (const file of valid) {
    setP('parse', 0); setP('chunk', 0); setP('index', 0)

    const content = await parse(file)
    setP('parse', 100)

    const docId = await addDocument({ title: file.name, source: file.name, mime: file.type, hash: '' })
    const chunks = chunkContent(content, docId)
    await bulkAddChunks(chunks)
    totalChunks += chunks.length
    setP('chunk', 100)

    const chunksWithIds = await getAllChunks()
    const docChunks = chunksWithIds.filter((c) => c.docId === docId)

    if (nanoSession) {
      const cards = await generateIndexCardsBatch(nanoSession, docChunks, () => {
        // progress handled below
      })
      await persistIndexCards(cards)
      setP('index', 100)
    } else {
      const fc = new Map()
      for (const c of docChunks) {
        if (c.id === undefined) continue
        fc.set(c.id, { summary: extractSummary(c.text), keywords: extractKeywords(c.text) })
      }
      await persistIndexCards(fc)
      setP('index', 100)
    }
  }

  await upsertManifest({
    kbName: 'Local KB',
    createdAt: Date.now(),
    docCount: (await listDocuments()).length,
    chunkCount: totalChunks,
    version: '1.0.0',
    contentHash: '',
  })

  addMessage('ai', `Ingested ${valid.length} file(s) (${totalChunks} chunks). Ask me anything!`)
  updateStats()
  refreshDocList()

  setTimeout(() => { progressArea.style.display = 'none' }, 500)
}

async function updateStats() {
  const docs = await listDocuments()
  const chunks = await getAllChunks()
  statsBar.style.display = 'flex'
  document.querySelector('#stat-docs')!.textContent = String(docs.length)
  document.querySelector('#stat-chunks')!.textContent = String(chunks.length)
}

async function refreshDocList() {
  const docs = await listDocuments()
  if (docs.length === 0) {
    docListArea.innerHTML = ''
    return
  }
  docListArea.innerHTML = docs.map((d) => `
    <div class="doc-item-mini">
      <span class="doc-name-mini">${d.title}</span>
      <button class="doc-delete-mini" data-id="${d.id}">✕</button>
    </div>
  `).join('')

  docListArea.querySelectorAll('.doc-delete-mini').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.getAttribute('data-id') || '0')
      if (id) { await deleteDocument(id); refreshDocList(); updateStats() }
    })
  })
}

async function handleExport() {
  const docs = await listDocuments()
  const chunks = await getAllChunks()
  const manifest = (await getManifest()) || {
    kbName: 'Local KB', createdAt: Date.now(), docCount: docs.length,
    chunkCount: chunks.length, version: '1.0.0', contentHash: '',
  }
  const snapshot = serializeSnapshot(docs, chunks, manifest)
  snapshot.manifest.contentHash = await computeContentHash(snapshot)
  const blob = await compressData(JSON.stringify(snapshot))
  triggerDownload(blob, `recallwell-nano-${Date.now()}.rwkb.json.gz`)
  const msg = document.querySelector('#export-msg') as HTMLElement
  msg.innerHTML = `<div class="export-success">Exported! Check downloads.</div>`
  setTimeout(() => { msg.innerHTML = '' }, 3000)
}

async function initNano() {
  const dot = document.querySelector('#status-dot') as HTMLElement
  const statusText = document.querySelector('#status-text') as HTMLElement

  const capability = await detectCapability()

  if (capability.available) {
    try {
      nanoSession = await createSession()
      dot.className = 'status-dot online'
      statusText.textContent = 'Online - AI ready'
    } catch {
      dot.className = 'status-dot offline'
      statusText.textContent = 'Offline mode'
      bannerArea.innerHTML = `<div class="banner banner-incapable">AI session failed. Running in keyword mode.</div>`
    }
  } else {
    dot.className = 'status-dot offline'
    statusText.textContent = 'Offline mode'
    bannerArea.innerHTML = `<div class="banner banner-incapable">Enable AI: <code>chrome://flags/#enable-built-in-ai</code></div>`
  }
}

initNano()
updateStats()
refreshDocList()
