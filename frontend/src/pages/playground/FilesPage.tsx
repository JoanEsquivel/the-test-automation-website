import { useRef, useState, type DragEvent } from 'react'

import { api, ApiError } from '@/api/client'
import type { UploadEcho } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { PageIntro } from '@/components/ui/PageIntro'
import { DifficultySelector } from '@/playground/DifficultySelector'
import { AutomationNote } from '@/pages/playground/widgets/ChallengeChrome'
import { VariantCard, WidgetSection } from '@/pages/playground/widgets/WidgetChrome'

function DownloadCard({
  fileName,
  label,
  description,
}: {
  fileName: 'products.csv' | 'sample-report.pdf'
  label: string
  description: string
}) {
  const url = api.files.downloadUrl(fileName)

  /**
   * Fetch the bytes, then save them from a blob URL.
   *
   * Letting the browser follow the href directly works in backend mode but NOT in
   * browser mode: MSW's service worker deliberately ignores requests with
   * `mode === 'navigate'`, which is exactly what an `<a download>` produces. On
   * GitHub Pages the request would fall through to the SPA fallback and save
   * index.html under the name of the file. Going through fetch() keeps ONE code
   * path whose observable outcome — a file with the right name and bytes — is
   * identical in both modes.
   */
  async function triggerDownload() {
    const response = await fetch(url)
    const objectUrl = URL.createObjectURL(await response.blob())
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = fileName
    anchor.click()
    // Revoking synchronously can cancel the save in some browsers.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
  }

  return (
    <VariantCard name={label} verdict="challenge">
      <p className="text-xs text-mist-400">{description}</p>
      {/* The href stays the real API URL so it is inspectable and copyable; the
          click is handled in JS for the reason explained above. */}
      <a
        href={url}
        download={fileName}
        onClick={(event) => {
          event.preventDefault()
          void triggerDownload()
        }}
        className="inline-flex w-fit items-center rounded-lg border border-ink-600 bg-ink-800 px-4 py-2 text-sm font-medium text-volt-300 hover:bg-ink-700"
      >
        Download {fileName}
      </a>
      <Button size="sm" variant="secondary" onClick={() => void triggerDownload()}>
        Download via button
      </Button>
      <AutomationNote>
        Playwright: <code>const [download] = await Promise.all([page.waitForEvent(&apos;download&apos;),
        link.click()])</code>, then assert <code>download.suggestedFilename()</code>. Selenium has
        no download API — configure the browser profile&apos;s download directory and poll the
        filesystem.
      </AutomationNote>
    </VariantCard>
  )
}

function UploadSection() {
  const [echo, setEcho] = useState<UploadEcho | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      setEcho(await api.files.upload(file))
    } catch (caught) {
      setEcho(null)
      setError(caught instanceof ApiError ? caught.message : 'Upload failed unexpectedly.')
    } finally {
      setBusy(false)
    }
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setDragActive(false)
    void handleFile(event.dataTransfer.files[0])
  }

  return (
    <WidgetSection
      title="Upload"
      description="Two entry points to the same POST /api/files/upload endpoint: the classic file input and a drag-drop zone. The server echoes what it received — your assertion target. Files over 1 MB are rejected."
      columns="md:grid-cols-2"
    >
      <VariantCard name='<input type="file">' verdict="challenge">
        <label className="flex flex-col gap-2 text-xs font-medium text-mist-400">
          Choose a file (max 1 MB)
          <input
            ref={inputRef}
            type="file"
            onChange={(event) => void handleFile(event.target.files?.[0])}
            className="text-sm text-mist-300 file:mr-3 file:rounded-lg file:border-0 file:bg-volt-500 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink-950 hover:file:bg-volt-400"
          />
        </label>
        <AutomationNote>
          The reliable path in every tool: <code>setInputFiles()</code> (Playwright) or{' '}
          <code>sendKeys(absolutePath)</code> (Selenium) directly on the input — no OS file
          dialog involved.
        </AutomationNote>
      </VariantCard>

      <VariantCard name="Drag-drop zone" verdict="challenge">
        <button
          type="button"
          aria-label="File drop zone — click to browse or drop a file"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`flex h-28 w-full items-center justify-center rounded-xl border-2 border-dashed px-4 text-sm transition-colors ${
            dragActive
              ? 'border-volt-400 bg-volt-500/10 text-volt-300'
              : 'border-ink-600 bg-ink-950/40 text-mist-400 hover:border-ink-500'
          }`}
        >
          {busy ? 'Uploading…' : 'Drop a file here (or click to browse)'}
        </button>
        <AutomationNote>
          Drag-drop from the OS cannot be automated through the browser. Either dispatch a
          synthetic <code>drop</code> event carrying a <code>DataTransfer</code> with your file,
          or upload through the file input — same endpoint, same echo.
        </AutomationNote>
      </VariantCard>

      <div className="md:col-span-2">
        {echo ? (
          <dl
            data-testid="files-upload-echo"
            className="grid grid-cols-3 gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm"
          >
            <div>
              <dt className="text-xs uppercase tracking-wide text-mist-500">fileName</dt>
              <dd className="font-mono text-emerald-300">{echo.fileName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-mist-500">sizeBytes</dt>
              <dd className="font-mono text-emerald-300">{echo.sizeBytes}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-mist-500">contentType</dt>
              <dd className="font-mono text-emerald-300">{echo.contentType}</dd>
            </div>
          </dl>
        ) : null}
        {error ? (
          <p
            data-testid="files-upload-error"
            role="alert"
            className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {error}
          </p>
        ) : null}
      </div>
    </WidgetSection>
  )
}

export default function FilesPage() {
  return (
    <div>
      <PageIntro
        title="Files"
        what="Download a generated CSV and PDF from the Files API, and upload any small file — the server echoes fileName, sizeBytes and contentType for your assertions."
        how="In backend mode FastAPI serves the files; in browser mode the MSW service worker generates and streams the very same bytes, so downloads work even on GitHub Pages. Uploads over 1 MB come back as a 400 VALIDATION_ERROR — try it."
      />
      <DifficultySelector />

      <WidgetSection
        title="Downloads"
        description="Both links carry the download attribute and an attachment Content-Disposition, so the browser saves instead of navigating."
        columns="md:grid-cols-2"
      >
        <DownloadCard
          fileName="products.csv"
          label="GET /api/files/products.csv"
          description="CSV of the product catalog (header: id,name,price,category,stock) — generated from the same seed data in both modes."
        />
        <DownloadCard
          fileName="sample-report.pdf"
          label="GET /api/files/sample-report.pdf"
          description="A minimal hand-built PDF (starts with the %PDF- magic bytes) — enough to assert a real binary download."
        />
      </WidgetSection>

      <UploadSection />
    </div>
  )
}
