import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../src/App'

describe('App flow regression tests', () => {
  beforeEach(() => {
    // localStorage, matchMedia, and scrollTo are provided by tests/setup.js
    // Ensure clean state for each test (the global mock supports .clear())
    if (globalThis.localStorage && typeof globalThis.localStorage.clear === 'function') {
      globalThis.localStorage.clear()
    }
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
