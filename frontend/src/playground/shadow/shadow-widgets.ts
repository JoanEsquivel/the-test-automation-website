/** Vanilla custom elements for the shadow DOM playground. NO React inside the
 * shadow roots — this is exactly the situation testers meet in the wild.
 *
 * Every widget mirrors an observable outcome to a light-DOM attribute on its
 * host (`data-value`, `data-count`, `data-unlocked`), so pages and tests can
 * assert WITHOUT piercing the shadow boundary. Custom properties (our theme
 * tokens) inherit through shadow boundaries, so the styles below reuse them.
 */

import type { DetailedHTMLProps, HTMLAttributes } from 'react'

const SHARED_CSS = `
  :host { display: block; font-family: ui-sans-serif, system-ui, sans-serif; }
  label { display: flex; flex-direction: column; gap: 4px; font-size: 12px;
          color: var(--color-mist-400, #94a0ba); font-weight: 500; }
  input { border: 1px solid var(--color-ink-600, #2b3a5e); border-radius: 8px;
          background: var(--color-ink-800, #121a30); padding: 6px 12px;
          font-size: 14px; color: var(--color-mist-50, #eef1f8); }
  button { border: 0; border-radius: 8px; background: var(--color-volt-500, #06b6d4);
           color: var(--color-ink-950, #070b14); padding: 6px 12px; font-size: 13px;
           font-weight: 600; cursor: pointer; }
  p { margin: 8px 0 0; font-size: 12px; color: var(--color-mist-300, #b3bdd2); }
  span.value { font-family: ui-monospace, monospace; color: var(--color-volt-300, #67e8f9); }
`

/** Open shadow root: label + input + readout, mirrored to host[data-value]. */
class TawShadowInput extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return
    const root = this.attachShadow({ mode: 'open' })
    root.innerHTML = `
      <style>${SHARED_CSS}</style>
      <label>Name inside the shadow
        <input type="text" placeholder="Type in here" />
      </label>
      <p>Shadow readout: <span class="value">empty</span></p>
    `
    const input = root.querySelector('input')
    const value = root.querySelector('span.value')
    this.setAttribute('data-value', '')
    input?.addEventListener('input', () => {
      if (value) value.textContent = input.value || 'empty'
      this.setAttribute('data-value', input.value)
    })
  }
}

/** Inner display used by the counter — its own OPEN shadow root, nested. */
class TawShadowDisplay extends HTMLElement {
  static observedAttributes = ['value']

  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' })
      root.innerHTML = `
        <style>
          :host { display: inline-block; }
          strong { font-family: ui-monospace, monospace; font-size: 20px;
                   color: var(--color-volt-300, #67e8f9); }
        </style>
        <strong>0</strong>
      `
    }
    this.render()
  }

  attributeChangedCallback() {
    this.render()
  }

  render() {
    const target = this.shadowRoot?.querySelector('strong')
    if (target) target.textContent = this.getAttribute('value') ?? '0'
  }
}

/** Open shadow root CONTAINING a nested open-shadow element (the display). */
class TawShadowCounter extends HTMLElement {
  #count = 0

  connectedCallback() {
    if (this.shadowRoot) return
    const root = this.attachShadow({ mode: 'open' })
    root.innerHTML = `
      <style>${SHARED_CSS}
        .row { display: flex; align-items: center; gap: 12px; }
      </style>
      <div class="row">
        <button type="button" data-action="decrement" aria-label="Decrement">−</button>
        <taw-shadow-display value="0"></taw-shadow-display>
        <button type="button" data-action="increment" aria-label="Increment">+</button>
      </div>
      <p>The number lives in a NESTED shadow root inside this one.</p>
    `
    const display = root.querySelector('taw-shadow-display')
    const update = (delta: number) => {
      this.#count += delta
      display?.setAttribute('value', String(this.#count))
      this.setAttribute('data-count', String(this.#count))
    }
    this.setAttribute('data-count', '0')
    root
      .querySelector('button[data-action="increment"]')
      ?.addEventListener('click', () => update(1))
    root
      .querySelector('button[data-action="decrement"]')
      ?.addEventListener('click', () => update(-1))
  }
}

/** CLOSED shadow root: the evil case. host.shadowRoot === null, so no tool can
 * reach inside via the DOM. The only observable is the host attribute the
 * component CHOOSES to expose — which is exactly the lesson. */
class TawShadowVault extends HTMLElement {
  #root: ShadowRoot | null = null

  connectedCallback() {
    if (this.#root) return
    this.#root = this.attachShadow({ mode: 'closed' })
    this.#root.innerHTML = `
      <style>${SHARED_CSS}</style>
      <label>Secret passphrase (hint: open-sesame)
        <input type="password" placeholder="Locked inside a closed root" />
      </label>
      <button type="button">Unlock vault</button>
      <p>Result: <span class="value">locked</span></p>
    `
    const input = this.#root.querySelector('input')
    const status = this.#root.querySelector('span.value')
    this.setAttribute('data-unlocked', 'false')
    this.#root.querySelector('button')?.addEventListener('click', () => {
      const unlocked = input?.value === 'open-sesame'
      if (status) status.textContent = unlocked ? 'unlocked' : 'wrong passphrase'
      this.setAttribute('data-unlocked', String(unlocked))
    })
  }
}

function define(name: string, ctor: CustomElementConstructor): void {
  if (!customElements.get(name)) {
    customElements.define(name, ctor)
  }
}

/** Idempotent registration — safe to import from multiple modules/tests. */
export function registerShadowWidgets(): void {
  if (typeof window === 'undefined' || !('customElements' in window)) return
  define('taw-shadow-display', TawShadowDisplay)
  define('taw-shadow-input', TawShadowInput)
  define('taw-shadow-counter', TawShadowCounter)
  define('taw-shadow-vault', TawShadowVault)
}

registerShadowWidgets()

/** React 19 renders custom elements natively; this teaches TypeScript's JSX
 * checker about the new tags. */
type ShadowHostProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'taw-shadow-input': ShadowHostProps
      'taw-shadow-counter': ShadowHostProps
      'taw-shadow-display': ShadowHostProps
      'taw-shadow-vault': ShadowHostProps
    }
  }
}
