import './style.css'
import { marked } from 'marked'
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

marked.setOptions({ breaks: true, gfm: true })

let nanoSession: NanoSession | null = null

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="app">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <div class="sidebar-logo">R</div>
          <div>
            <div class="sidebar-title">Recallwell</div>
            <div class="sidebar-subtitle">Knowledge Base</div>
          </div>
        </div>
        <div class="theme-toggle">
          <button class="theme-btn active" data-theme="light">
            <i class="bi bi-sun"></i> Light
          </button>
          <button class="theme-btn" data-theme="dark">
            <i class="bi bi-moon"></i> Dark
          </button>
        </div>
        <div class="sidebar-status">
          <span class="status-dot" id="status-dot"></span>
          <span id="status-text">Checking...</span>
        </div>
      </div>

      <div class="sidebar-content">
        <div class="sidebar-section">
          <div class="sidebar-section-title">Documents</div>
          <div class="ingest-zone" id="ingest-zone">
            <div class="ingest-icon"><i class="bi bi-cloud-arrow-up"></i></div>
            <div class="ingest-text">Drop files here</div>
            <div class="ingest-hint">or click to browse</div>
            <input type="file" id="file-input" multiple accept=".txt,.md,.html,.pdf" hidden>
          </div>
        </div>

        <div class="sidebar-section">
          <div class="progress-section" id="progress-area" style="display: none;"></div>
          <div class="doc-list" id="doc-list"></div>
        </div>
      </div>

      <div class="sidebar-stats" id="stats-bar" style="display: none;">
        <span><i class="bi bi-file-earmark-text"></i> <span id="stat-docs">0</span> docs</span>
        <span><i class="bi bi-grid-3x3-gap"></i> <span id="stat-chunks">0</span> chunks</span>
      </div>

      <div class="sidebar-footer">
        <button class="export-btn" id="export-btn">
          <i class="bi bi-download"></i> Export
        </button>
        <div id="export-msg"></div>
      </div>
    </aside>

    <main class="main">
      <div class="chat-header">
        <div>
          <div class="chat-title">Chat</div>
          <div class="chat-subtitle">Ask questions about your documents</div>
        </div>
      </div>

      <div class="chat-messages" id="chat-messages">
        <div class="empty-chat" id="empty-state">
          <div class="empty-icon"><i class="bi bi-stars"></i></div>
          <h3>How can I help you?</h3>
          <p>Add documents in the sidebar, then ask questions. I'll find relevant information and give you grounded answers.</p>
          <div class="hint-chips">
            <button class="hint-chip" data-q="What are the main topics?">Main topics</button>
            <button class="hint-chip" data-q="Summarize the content">Summarize</button>
            <button class="hint-chip" data-q="Find key insights">Key insights</button>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <div class="input-container">
          <div class="input-wrapper">
            <textarea class="chat-input" id="chat-input" placeholder="Ask anything..." rows="1"></textarea>
            <button class="send-btn" id="send-btn" disabled>
              <i class="bi bi-arrow-up"></i>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
  <div id="drawer-container"></div>
`

// Elements
const chatMessages = document.querySelector('#chat-messages') as HTMLElement
const chatInput = document.querySelector('#chat-input') as HTMLTextAreaElement
const sendBtn = document.querySelector('#send-btn') as HTMLButtonElement
const emptyState = document.querySelector('#empty-state') as HTMLElement
const ingestZone = document.querySelector('#ingest-zone') as HTMLElement
const fileInput = document.querySelector('#file-input') as HTMLInputElement
const progressArea = document.querySelector('#progress-area') as HTMLElement
const docList = document.querySelector('#doc-list') as HTMLElement
const statsBar = document.querySelector('#stats-bar') as HTMLElement
const drawerContainer = document.querySelector('#drawer-container') as HTMLElement

// Theme toggle
const savedTheme = localStorage.getItem('theme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)
updateThemeButtons()

document.querySelectorAll('.theme-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const theme = btn.getAttribute('data-theme') || 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    updateThemeButtons()
  })
})

function updateThemeButtons() {
  const current = document.documentElement.getAttribute('data-theme')
  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-theme') === current)
  })
}

// Hint chips
document.querySelectorAll('.hint-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const q = chip.getAttribute('data-q')
    if (q) {
      chatInput.value = q
      updateSendButton()
      sendMessage()
    }
  })
})

// Auto-resize textarea
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto'
  chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + 'px'
  updateSendButton()
})

function updateSendButton() {
  sendBtn.disabled = !chatInput.value.trim()
}

// File ingest
ingestZone.addEventListener('click', () => fileInput.click())
fileInput.addEventListener('change', () => {
  const files = Array.from(fileInput.files || [])
  if (files.length > 0) handleFiles(files)
  fileInput.value = ''
})

// Drag and drop
ingestZone.addEventListener('dragover', (e) => {
  e.preventDefault()
  ingestZone.classList.add('dragging')
})

ingestZone.addEventListener('dragleave', () => {
  ingestZone.classList.remove('dragging')
})

ingestZone.addEventListener('drop', (e) => {
  e.preventDefault()
  ingestZone.classList.remove('dragging')
  const files = Array.from(e.dataTransfer?.files || [])
  if (files.length > 0) handleFiles(files)
})

// Enter sends, Shift+Enter newline
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
})

sendBtn.addEventListener('click', sendMessage)

function sendMessage() {
  const q = chatInput.value.trim()
  if (!q) return
  handleAsk(q)
  chatInput.value = ''
  chatInput.style.height = 'auto'
  updateSendButton()
}

document.querySelector('#export-btn')?.addEventListener('click', handleExport)

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight
  })
}

function renderMarkdown(text: string): string {
  const clean = text.replace(/\d+#\d+/g, '').replace(/\s{2,}/g, ' ').trim()
  return marked.parse(clean) as string
}

function formatTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function addMessage(role: 'user' | 'ai', text: string, citations?: Array<{ docId: number; ordinal: number }>) {
  if (emptyState) emptyState.remove()

  const msgEl = document.createElement('div')
  msgEl.className = `message message-${role}`

  const avatarIcon = role === 'user' ? 'bi-person-fill' : 'bi-stars'
  const name = role === 'user' ? 'You' : 'Recallwell'
  const content = role === 'ai' ? renderMarkdown(text) : escapeHtml(text)

  let citationsHtml = ''
  if (citations && citations.length > 0) {
    citationsHtml = `
      <div class="citations-row">
        <span class="citations-label">Sources</span>
        ${citations.map((c) => `<button class="citation-chip" data-doc="${c.docId}" data-ord="${c.ordinal}"><i class="bi bi-file-earmark-text"></i>${c.docId}#${c.ordinal}</button>`).join('')}
      </div>
    `
  }

  msgEl.innerHTML = `
    <div class="msg-avatar"><i class="bi ${avatarIcon}"></i></div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-name">${name}</span>
        <span class="msg-time">${formatTime()}</span>
      </div>
      <div class="bubble">${content}${citationsHtml}</div>
    </div>
  `

  chatMessages.appendChild(msgEl)
  scrollToBottom()

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
    <div class="msg-avatar"><i class="bi bi-stars"></i></div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-name">Recallwell</span>
      </div>
      <div class="bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
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
          <span class="drawer-title"><i class="bi bi-file-earmark-text"></i> Doc ${chunk.docId} #${chunk.ordinal}</span>
          <button class="drawer-close" id="close-drawer"><i class="bi bi-x-lg"></i></button>
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
      addMessage('ai', 'No documents ingested yet. Add files in the sidebar to get started.')
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
      const cards = await generateIndexCardsBatch(nanoSession, docChunks, () => {})
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

  addMessage('ai', `Done! Ingested **${valid.length}** file(s) with **${totalChunks}** chunks.`)
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
    docList.innerHTML = ''
    return
  }
  docList.innerHTML = docs.map((d) => `
    <div class="doc-item">
      <div class="doc-icon"><i class="bi bi-file-earmark-text"></i></div>
      <div class="doc-info">
        <div class="doc-name">${d.title}</div>
        <div class="doc-meta">${d.mime || 'file'}</div>
      </div>
      <button class="doc-delete" data-id="${d.id}"><i class="bi bi-trash3"></i></button>
    </div>
  `).join('')

  docList.querySelectorAll('.doc-delete').forEach((btn) => {
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
  msg.innerHTML = `<div class="export-success"><i class="bi bi-check-circle-fill"></i> Exported</div>`
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
      statusText.textContent = 'AI Ready'
    } catch {
      dot.className = 'status-dot offline'
      statusText.textContent = 'Keyword Mode'
    }
  } else {
    dot.className = 'status-dot offline'
    statusText.textContent = 'Keyword Mode'
  }
}

initNano()
updateStats()
refreshDocList()
