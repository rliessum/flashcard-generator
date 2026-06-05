import { vi } from 'vitest'

function createStorageMock() {
  let store = {}
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
    },
    setItem(key, value) {
      store[key] = String(value)
    },
    removeItem(key) {
      delete store[key]
    },
    clear() {
      store = {}
    },
  }
}

// Provide a controllable localStorage mock for all tests.
// This avoids jsdom experimental warnings and ensures clean state between tests.
if (typeof window !== 'undefined') {
  const storageMock = createStorageMock()
  Object.defineProperty(window, 'localStorage', {
    value: storageMock,
    configurable: true,
    writable: true,
  })
  // Also on globalThis for code that uses globalThis.localStorage directly
  Object.defineProperty(globalThis, 'localStorage', {
    value: storageMock,
    configurable: true,
    writable: true,
  })
}

// Provide a minimal matchMedia implementation for jsdom.
// This is required because App.jsx calls window.matchMedia during mount
// for PWA "installed" detection (display-mode: standalone).
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// Ensure scrollTo is always a no-op function (used in beforeEach of some tests too)
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn()
}
