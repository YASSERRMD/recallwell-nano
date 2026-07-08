import './style.css'
import { detectCapability } from './nano/capability'
import { createSession, type NanoSession } from './nano/session'
import { createUnavailableState, createAvailableState, type NanoState } from './nano/state'
import { createDropzone } from './ui/dropzone'
import { validateFiles } from './ui/validation'
import { createProgressBar, updateProgress } from './ui/progress'
import { renderDocumentList } from './ui/documentList'
import { renderManifestStats } from './ui/manifestStats'
import { renderCapabilityBanner } from './ui/capabilityBanner'
import { renderFallbackMode } from './ui/fallbackMode'
import { createQuestionInput } from './ui/questionInput'
import { createAnswerView, showLoading, hideLoading, setAnswer } from './ui/answerView'
import { renderCitationChips } from './ui/citationChips'
import { createChunkDrawer, showChunkDrawer } from './ui/chunkDrawer'
import { createExportButton, showExportConfirmation } from './ui/exportButton'
import { listDocuments, addDocument, deleteDocument } from './db/repositories/document'
import { bulkAddChunks } from './db/repositories/chunk'
import { upsertManifest, getManifest } from './db/repositories/manifest'
import { parse } from './ingest/parsers'
import { chunkContent } from './ingest/chunker/splitter'
import { generateIndexCardsBatch } from './index/batch'
import { persistIndexCards } from './index/persist'
import { extractKeywords, extractSummary } from './index/fallback'
import { getAllChunks } from './db/repositories/chunk'
import { shortlistCandidates } from './retrieval/shortlist'
import { loadTopKChunks } from './answer/loadChunks'
import { buildGroundedPrompt } from './answer/prompt'
import { parseCitations } from './answer/citations'
import { serializeSnapshot } from './export/serialize'
import { computeContentHash } from './export/hash'
import { compressData } from './export/compress'
import { triggerDownload } from './export/download'

let nanoState: NanoState = createUnavailableState('Not initialized')
let nanoSession: NanoSession | null = null

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <header>
    <h1>Recallwell Nano</h1>
    <p>On-device, vectorless knowledge-base Q&A</p>
  </header>
  <div id="capability-banner"></div>
  <main>
    <section id="ingest-section">
      <h2>Ingest Documents</h2>
      <div id="dropzone-container"></div>
      <div id="progress-container" style="display: none;"></div>
      <div id="error-container"></div>
    </section>
    <section id="kb-section">
      <h2>Knowledge Base</h2>
      <div id="manifest-container"></div>
      <div id="document-list-container"></div>
    </section>
    <section id="qa-section">
      <h2>Ask a Question</h2>
      <div id="fallback-container" style="display: none;"></div>
      <div id="question-container"></div>
      <div id="answer-container"></div>
      <div id="citations-container"></div>
      <div id="chunk-drawer-container"></div>
    </section>
    <section id="export-section">
      <h2>Publish</h2>
      <div id="export-container"></div>
    </section>
  </main>
`

async function initNano() {
  const capability = await detectCapability()
  const bannerEl = document.querySelector('#capability-banner') as HTMLElement

  if (capability.available) {
    nanoState = createAvailableState(await createSession())
    nanoSession = nanoState.session
    renderCapabilityBanner(bannerEl, true)
  } else {
    nanoState = createUnavailableState(capability.error || 'Not available')
    renderCapabilityBanner(bannerEl, false, capability.error)
    const fallbackEl = document.querySelector('#fallback-container') as HTMLElement
    renderFallbackMode(fallbackEl)
    fallbackEl.style.display = 'block'
  }
}

async function refreshDocList() {
  const docs = await listDocuments()
  const manifest = await getManifest()
  const docListEl = document.querySelector('#document-list-container') as HTMLElement
  const manifestEl = document.querySelector('#manifest-container') as HTMLElement

  renderDocumentList(docListEl, docs, {
    onDelete: async (id) => {
      await deleteDocument(id)
      refreshDocList()
    },
  })

  renderManifestStats(manifestEl, manifest)
}

async function handleFiles(files: File[]) {
  const { valid, invalid } = validateFiles(files)

  const errorEl = document.querySelector('#error-container') as HTMLElement
  if (invalid.length > 0) {
    errorEl.innerHTML = `<p class="error">${invalid.map((i) => `${i.file.name}: ${i.reason}`).join(', ')}</p>`
  } else {
    errorEl.innerHTML = ''
  }

  if (valid.length === 0) return

  const progressEl = document.querySelector('#progress-container') as HTMLElement
  progressEl.style.display = 'block'
  createProgressBar(progressEl)

  let totalChunks = 0
  let totalIndexed = 0

  for (const file of valid) {
    updateProgress(progressEl, { parse: 0, chunk: 0, indexCard: 0 })

    const content = await parse(file)
    updateProgress(progressEl, { parse: 100, chunk: 0, indexCard: 0 })

    const docId = await addDocument({
      title: file.name,
      source: file.name,
      mime: file.type,
      hash: '',
    })

    const chunks = chunkContent(content, docId)
    await bulkAddChunks(chunks)
    totalChunks += chunks.length
    updateProgress(progressEl, { parse: 100, chunk: 100, indexCard: 0 })

    if (nanoSession) {
      const chunksWithIds = await getAllChunks()
      const docChunks = chunksWithIds.filter((c) => c.docId === docId)
      const cards = await generateIndexCardsBatch(nanoSession, docChunks, (current, total) => {
        const pct = Math.round((current / total) * 100)
        updateProgress(progressEl, { parse: 100, chunk: 100, indexCard: pct })
      })
      await persistIndexCards(cards)
      totalIndexed += cards.size
    } else {
      const chunksWithIds = await getAllChunks()
      const docChunks = chunksWithIds.filter((c) => c.docId === docId)
      const fallbackCards = new Map()
      for (const chunk of docChunks) {
        if (chunk.id === undefined) continue
        fallbackCards.set(chunk.id, {
          summary: extractSummary(chunk.text),
          keywords: extractKeywords(chunk.text),
        })
      }
      await persistIndexCards(fallbackCards)
      totalIndexed += fallbackCards.size
    }

    updateProgress(progressEl, { parse: 100, chunk: 100, indexCard: 100 })
  }

  await upsertManifest({
    kbName: 'Local KB',
    createdAt: Date.now(),
    docCount: (await listDocuments()).length,
    chunkCount: totalChunks,
    version: '1.0.0',
    contentHash: '',
  })

  refreshDocList()
  progressEl.style.display = 'none'
}

async function handleAsk(question: string) {
  const answerEl = document.querySelector('#answer-container') as HTMLElement
  const citationsEl = document.querySelector('#citations-container') as HTMLElement
  const drawerEl = document.querySelector('#chunk-drawer-container') as HTMLElement

  createAnswerView(answerEl)
  showLoading(answerEl)

  try {
    const allChunks = await getAllChunks()
    const candidateIds = shortlistCandidates(allChunks, question)
    const topKChunks = await loadTopKChunks(candidateIds.slice(0, 10))

    if (topKChunks.length === 0) {
      hideLoading(answerEl)
      setAnswer(answerEl, 'No relevant documents found. Please ingest some documents first.')
      return
    }

    let answer: string
    if (nanoSession) {
      const prompt = buildGroundedPrompt(topKChunks, question)
      answer = await nanoSession.prompt(prompt)
    } else {
      const summaries = topKChunks.map((c) => c.summary || c.text.slice(0, 200)).join('\n')
      answer = `Based on keyword matching:\n\n${summaries}`
    }

    hideLoading(answerEl)
    setAnswer(answerEl, answer)

    const citations = parseCitations(answer)
    if (citations.length > 0) {
      const citedChunks = topKChunks.filter(
        (c) => c.id !== undefined && citations.some((ci) => ci.docId === c.docId && ci.ordinal === c.ordinal),
      )
      renderCitationChips(citationsEl, citedChunks, {
        onCitationClick: (chunk) => {
          createChunkDrawer(drawerEl)
          showChunkDrawer(drawerEl, chunk)
        },
      })
    }
  } catch (e) {
    hideLoading(answerEl)
    setAnswer(answerEl, `Error: ${e instanceof Error ? e.message : String(e)}`)
  }
}

async function handleExport() {
  const docs = await listDocuments()
  const chunks = await getAllChunks()
  const manifest = (await getManifest()) || {
    kbName: 'Local KB',
    createdAt: Date.now(),
    docCount: docs.length,
    chunkCount: chunks.length,
    version: '1.0.0',
    contentHash: '',
  }

  const snapshot = serializeSnapshot(docs, chunks, manifest)
  snapshot.manifest.contentHash = await computeContentHash(snapshot)
  const json = JSON.stringify(snapshot)
  const blob = await compressData(json)

  triggerDownload(blob, `recallwell-nano-${Date.now()}.rwkb.json.gz`)
  const exportEl = document.querySelector('#export-container') as HTMLElement
  showExportConfirmation(exportEl)
}

const dropzoneEl = document.querySelector('#dropzone-container') as HTMLElement
createDropzone(dropzoneEl, { onFiles: handleFiles })

const questionEl = document.querySelector('#question-container') as HTMLElement
createQuestionInput(questionEl, { onAsk: handleAsk })

const exportEl = document.querySelector('#export-container') as HTMLElement
createExportButton(exportEl, { onExport: handleExport })

initNano()
refreshDocList()
