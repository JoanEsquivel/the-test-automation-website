import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { AutomationNote, ChallengeReadout } from '@/pages/playground/widgets/ChallengeChrome'
import { VariantCard } from '@/pages/playground/widgets/WidgetChrome'

/** E.2 — native range input + custom ARIA slider driven by arrow keys. */
export function Sliders() {
  const [nativeValue, setNativeValue] = useState(30)
  const [ariaValue, setAriaValue] = useState(50)

  function onAriaKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = 5
    let next: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = Math.min(100, ariaValue + step)
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = Math.max(0, ariaValue - step)
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = 100
    if (next !== null) {
      event.preventDefault()
      setAriaValue(next)
    }
  }

  return (
    <VariantCard name="3. Sliders — native range & custom ARIA" verdict="challenge">
      <label className="flex flex-col gap-1 text-xs font-medium text-mist-400">
        Native range
        <input
          type="range"
          min={0}
          max={100}
          value={nativeValue}
          onChange={(event) => setNativeValue(Number(event.target.value))}
          className="accent-volt-400"
        />
      </label>
      <ChallengeReadout testId="interactions-range-readout" label="Native value" value={String(nativeValue)} />

      <div className="flex flex-col gap-1">
        <span id="aria-slider-label" className="text-xs font-medium text-mist-400">
          Custom ARIA slider
        </span>
        <div
          role="slider"
          tabIndex={0}
          aria-labelledby="aria-slider-label"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={ariaValue}
          onKeyDown={onAriaKeyDown}
          className="relative h-3 cursor-pointer rounded-full border border-ink-600 bg-ink-800"
        >
          <div className="h-full rounded-full bg-pulse-500" style={{ width: `${ariaValue}%` }} />
          <div
            aria-hidden="true"
            className="absolute top-1/2 size-4 -translate-y-1/2 rounded-full border border-pulse-300 bg-pulse-400"
            style={{ left: `calc(${ariaValue}% - 8px)` }}
          />
        </div>
      </div>
      <ChallengeReadout testId="interactions-aria-slider-readout" label="ARIA value" value={String(ariaValue)} />
      <AutomationNote>
        For the native range, <code>locator.fill(&apos;70&apos;)</code> (Playwright) or a JS
        value+input event works. The ARIA slider only listens to KEYBOARD events: focus it and
        send arrow keys, then assert <code>aria-valuenow</code>.
      </AutomationNote>
    </VariantCard>
  )
}

/** E.3 — canvas pad: draw with pointer events, assert via readouts. */
export function CanvasPad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const [strokes, setStrokes] = useState(0)
  const [lastPoint, setLastPoint] = useState('none yet')

  function point(event: PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: Math.round(event.clientX - rect.left), y: Math.round(event.clientY - rect.top) }
  }

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    drawing.current = true
    setStrokes((count) => count + 1)
    const { x, y } = point(event)
    setLastPoint(`(${x}, ${y})`)
    const context = canvasRef.current?.getContext('2d')
    if (context) {
      context.strokeStyle = '#22d3ee'
      context.lineWidth = 2
      context.beginPath()
      context.moveTo(x, y)
    }
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const { x, y } = point(event)
    setLastPoint(`(${x}, ${y})`)
    const context = canvasRef.current?.getContext('2d')
    if (context) {
      context.lineTo(x, y)
      context.stroke()
    }
  }

  function clear() {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height)
    setStrokes(0)
    setLastPoint('none yet')
  }

  return (
    <VariantCard name="4. Canvas pad (pointer drawing)" verdict="challenge">
      <p className="text-xs text-mist-400">
        A canvas has no inner DOM to locate — you can only send coordinates and assert the
        SIDE-EFFECTS the app exposes: stroke count and last position.
      </p>
      <canvas
        ref={canvasRef}
        width={320}
        height={160}
        aria-label="Drawing pad"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => {
          drawing.current = false
        }}
        onPointerLeave={() => {
          drawing.current = false
        }}
        className="w-full touch-none rounded-lg border border-ink-600 bg-ink-950"
      />
      <Button size="sm" variant="ghost" onClick={clear}>
        Clear pad
      </Button>
      <ChallengeReadout testId="interactions-canvas-strokes" label="Strokes" value={String(strokes)} />
      <ChallengeReadout testId="interactions-canvas-last" label="Last point" value={lastPoint} />
      <AutomationNote>
        Compute coordinates from the canvas bounding box, then{' '}
        <code>mouse.move → down → move → up</code>. Never assert pixels — assert the readouts
        the application mirrors out (or, in real apps, the data model behind the canvas).
      </AutomationNote>
    </VariantCard>
  )
}
