import './style.css'
import { detectCapability } from './nano/capability'
import { createSession } from './nano/session'
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
import { parseCitations } from './answer/citations'
import { serializeSnapshot } from './export/serialize'
import { computeContentHash } from './export/hash'
import { compressData } from './export/compress'
import { triggerDownload } from './export/download'
import { validateFiles } from './ui/validation'
import { marked } from 'marked'

marked.setOptions({ breaks: true, gfm: true })

interface ChatMessage {
  role: 'user' | 'ai'
  text: string
  citations?: Array<{ docId: number; ordinal: number }>
}

const messages: ChatMessage[] = []

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="app">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <div class="sidebar-logo">R</div>
          <div>
            <div class="sidebar-title">Recallwell</div>
            <div class="sidebar-subtitle">Nano Knowledge Base</div>
          </div>
        </div>
        <div class="theme-toggle">
          <button class="theme-btn active" data-theme="light"><i class="bi bi-sun"></i> Light</button>
          <button class="theme-btn" data-theme="dark"><i class="bi bi-moon"></i> Dark</button>
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
            <div class="ingest-text">Drop files or click to ingest</div>
            <div class="ingest-hint">.txt, .md, .html, .pdf</div>
            <input type="file" id="file-input" multiple accept=".txt,.md,.html,.pdf" hidden>
          </div>
        </div>
        <div id="progress-section" class="progress-section" style="display: none;"></div>
        <div class="sidebar-section" id="doc-list-section">
          <div class="doc-list" id="doc-list"></div>
        </div>
      </div>
      <div class="sidebar-stats" id="stats-bar" style="display: none;">
        <span><i class="bi bi-file-earmark-text"></i> <span id="stat-docs">0</span> documents</span>
        <span><i class="bi bi-grid-3x3-gap"></i> <span id="stat-chunks">0</span> chunks</span>
      </div>
      <div class="sidebar-footer">
        <button class="export-btn" id="export-btn"><i class="bi bi-download"></i> Export Knowledge Base</button>
        <div id="export-msg"></div>
      </div>
    </aside>
    <section class="main">
      <header class="chat-header">
        <div>
          <div class="chat-title">Chat</div>
          <div class="chat-subtitle">Ask questions about your documents</div>
        </div>
      </header>
      <main class="chat-messages" id="chat-messages">
        <div class="empty-chat" id="empty-state">
          <div class="empty-icon"><i class="bi bi-stars"></i></div>
          <h3>How can I help you?</h3>
          <p>Ask questions about your documents. I'll find the relevant information and give you a grounded answer.</p>
          <div class="hint-chips">
            <button class="hint-chip" data-q="What are the main topics?">What are the main topics?</button>
            <button class="hint-chip" data-q="Summarize the documents">Summarize the documents</button>
            <button class="hint-chip" data-q="Find key information">Find key information</button>
          </div>
        </div>
      </main>
      <footer class="chat-input-area">
        <div class="input-container">
          <div class="input-wrapper">
            <textarea class="chat-input" id="chat-input" placeholder="Ask anything..." rows="1"></textarea>
            <button class="send-btn" id="send-btn" disabled><i class="bi bi-arrow-up"></i></button>
          </div>
        </div>
      </footer>
    </section>
  </div>
  <div id="drawer-container"></div>
`

// Elements
const chatMessages = document.querySelector('#chat-messages') as HTMLElement
const chatInput = document.querySelector('#chat-input') as HTMLTextAreaElement
const sendBtn = document.querySelector('#send-btn') as HTMLButtonElement
const emptyState = document.querySelector('#empty-state') as HTMLElement
const statsBar = document.querySelector('#stats-bar') as HTMLElement
const ingestZone = document.querySelector('#ingest-zone') as HTMLElement
const fileInput = document.querySelector('#file-input') as HTMLInputElement
const progressSection = document.querySelector('#progress-section') as HTMLElement
const docListArea = document.querySelector('#doc-list') as HTMLElement
const drawerContainer = document.querySelector('#drawer-container') as HTMLElement

// Theme toggle
document.querySelectorAll('.theme-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.theme-btn').forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    document.documentElement.setAttribute('data-theme', btn.getAttribute('data-theme') || 'light')
  })
})

// Set default theme
document.documentElement.setAttribute('data-theme', 'light')

// Auto-resize textarea + enable/disable send button
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto'
  chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + 'px'
  sendBtn.disabled = !chatInput.value.trim()
})

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

// Chat submit
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
})

sendBtn.addEventListener('click', () => {
  sendMessage()
})

// Hint chips
document.querySelectorAll('.hint-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const q = chip.getAttribute('data-q')
    if (q) {
      chatInput.value = q
      sendBtn.disabled = false
      sendMessage()
    }
  })
})

function sendMessage() {
  const q = chatInput.value.trim()
  if (q) {
    handleAsk(q)
    chatInput.value = ''
    chatInput.style.height = 'auto'
    sendBtn.disabled = true
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
  const renderedText = role === 'ai' ? marked.parse(text) as string : escapeHtml(text)

  let citationsHtml = ''
  if (citations && citations.length > 0) {
    citationsHtml = `
      <div class="citations-row">
        <span class="citations-label">Sources</span>
        ${citations.map((c) => `<button class="citation-chip" data-doc="${c.docId}" data-ord="${c.ordinal}"><i class="bi bi-file-earmark-text"></i> ${c.docId}#${c.ordinal}</button>`).join('')}
      </div>
    `
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  msgEl.innerHTML = `
    <div class="msg-avatar">${avatarText}</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-name">${role === 'user' ? 'You' : 'Recallwell'}</span>
        <span class="msg-time">${timeStr}</span>
      </div>
      <div class="bubble">${renderedText}${citationsHtml}</div>
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
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-name">Recallwell</span>
        <span class="msg-time">thinking...</span>
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
          <span class="drawer-title"><i class="bi bi-file-earmark-text"></i> Source: Doc ${chunk.docId} #${chunk.ordinal}</span>
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
      addMessage('ai', 'No documents ingested yet. Drop some files using the sidebar to get started!')
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

    console.log('[Query] Retrieved', topKChunks.length, 'relevant chunks from local store')

    try {
      console.log('[Query] Creating fresh Nano session...')
      const querySession = await createSession()
      console.log('[Query] Session created, sending chunks to Nano...')
      const prompt = buildGroundedPrompt(topKChunks, question)
      console.log('[Query] Prompt length:', prompt.length, 'chars')
      answer = await querySession.prompt(prompt)
      console.log('[Query] Nano responded, length:', answer.length)
      citations = parseCitations(answer)
      querySession.destroy()
      console.log('[Query] Done')
    } catch (e) {
      console.error('[Query] Nano failed:', e)
      hideTyping()
      addMessage('ai', `Gemini Nano error: ${e instanceof Error ? e.message : String(e)}. Make sure Chrome AI is enabled at chrome://flags/#prompt-api-for-gemini-nano`)
      return
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

  progressSection.style.display = 'block'
  progressSection.innerHTML = `
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
    try {
      setP('parse', 0); setP('chunk', 0); setP('index', 0)

      console.log('[1/5] Parsing:', file.name)
      const content = await parse(file)
      setP('parse', 100)
      console.log('[1/5] Done, text length:', content.text.length)

      console.log('[2/5] Adding document...')
      const docId = await addDocument({ title: file.name, source: file.name, mime: file.type, hash: '' })
      console.log('[2/5] Doc ID:', docId)

      console.log('[3/5] Chunking...')
      const chunks = chunkContent(content, docId)
      console.log('[3/5] Chunks:', chunks.length)

      console.log('[4/5] Saving chunks...')
      await bulkAddChunks(chunks)
      totalChunks += chunks.length
      setP('chunk', 100)
      console.log('[4/5] Done')

      console.log('[5/5] Indexing...')
      const chunksWithIds = await getAllChunks()
      const docChunks = chunksWithIds.filter((c) => c.docId === docId)

      try {
        console.log('[5/5] Creating fresh Nano session for indexing...')
        const indexSession = await createSession()
        console.log('[5/5] Fresh session created, indexing chunks...')

        const cards = await generateIndexCardsBatch(indexSession, docChunks, (current, total) => {
          const pct = Math.round((current / total) * 100)
          setP('index', pct)
          console.log(`[5/5] Nano indexing: ${current}/${total} (${pct}%)`)
        })
        await persistIndexCards(cards)
        indexSession.destroy()
        console.log('[5/5] Nano indexing done, cards:', cards.size)
      } catch (e) {
        console.error('[5/5] Nano indexing failed, using fallback:', e)
        const fc = new Map()
        for (const c of docChunks) {
          if (c.id === undefined) continue
          fc.set(c.id, { summary: extractSummary(c.text), keywords: extractKeywords(c.text) })
        }
        await persistIndexCards(fc)
      }
      setP('index', 100)
      console.log('[5/5] Done')
    } catch (e) {
      console.error('[Ingest] Error processing', file.name, ':', e)
      addMessage('ai', `Error processing ${file.name}: ${e instanceof Error ? e.message : String(e)}`)
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

  setTimeout(() => { progressSection.style.display = 'none' }, 500)
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
    <div class="doc-item">
      <div class="doc-icon"><i class="bi bi-file-earmark-text"></i></div>
      <div class="doc-info">
        <div class="doc-name">${d.title}</div>
        <div class="doc-meta">${d.mime || 'document'}</div>
      </div>
      <button class="doc-delete" data-id="${d.id}"><i class="bi bi-trash3"></i></button>
    </div>
  `).join('')

  docListArea.querySelectorAll('.doc-delete').forEach((btn) => {
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
    dot.className = 'status-dot online'
    statusText.textContent = 'Online - AI ready'
  } else {
    dot.className = 'status-dot offline'
    statusText.textContent = 'Offline mode'
  }
}

initNano()
updateStats()
refreshDocList()
