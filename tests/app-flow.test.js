import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../src/App'

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

describe('App flow regression tests', () => {
  beforeEach(() => {
    if (!globalThis.localStorage) {
      Object.defineProperty(globalThis, 'localStorage', {
        value: createStorageMock(),
        configurable: true,
        writable: true,
      })
    }
    globalThis.localStorage.clear()
    window.scrollTo = vi.fn()
  })

  it('allows continuing after CSV import and returning to step 1', async () => {
    render(React.createElement(App))

    fireEvent.change(screen.getByLabelText('Paste CSV data'), {
      target: { value: 'front,back\nhello,hallo\ncat,kat' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Load Pasted Data' }))

    await screen.findByText('Print Settings')

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    await screen.findByRole('button', { name: 'Next: Preview' })

    fireEvent.click(screen.getByRole('button', { name: 'Next: Preview' }))
    await screen.findByText('Print Settings')
  })

  it('builds preview from manual entry', async () => {
    render(React.createElement(App))

    fireEvent.change(screen.getByLabelText('Card 1 front'), {
      target: { value: 'sun' },
    })
    fireEvent.change(screen.getByLabelText('Card 1 back'), {
      target: { value: 'zon' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Next: Preview' }))

    await screen.findByText('Print Settings')
    expect(screen.getByText('sun')).toBeTruthy()
    expect(screen.getByText('zon')).toBeTruthy()
  })
})
