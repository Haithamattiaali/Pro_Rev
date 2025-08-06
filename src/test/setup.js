import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock AbortSignal.timeout
class MockAbortSignal {
  constructor() {
    this.aborted = false;
    this.reason = undefined;
    this.onabort = null;
  }
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {}
  throwIfAborted() {
    if (this.aborted) {
      throw this.reason;
    }
  }
}

global.AbortSignal.timeout = vi.fn((ms) => new MockAbortSignal())

// Mock fetch for connectionManager
global.fetch = vi.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({ status: 'OK', database: 'connected' })
}))
