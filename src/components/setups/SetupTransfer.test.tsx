// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../App.tsx'
import { getParameter, setValue } from '../../models/parameters.ts'
import { createDefaultSetup } from '../../models/setup.ts'
import { useLibraryStore } from '../../state/libraryStore.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { decodeSetup, encodeSetup, exportSetups } from '../../utils/setupTransfer.ts'
import { SetupTransfer } from './SetupTransfer.tsx'

const mine = createDefaultSetup('Indoor bow')
const theirs = {
  ...setValue(createDefaultSetup(), getParameter('arrow.spine'), 900),
  name: 'Coach',
}

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  useTuningStore.setState({ setup: mine, mode: 'simple', language: 'en', units: 'archery' })
  useLibraryStore.setState({ saved: [], failed: false })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const working = () => useTuningStore.getState().setup
const saved = () => useLibraryStore.getState().saved

describe('link to the setup on screen', () => {
  it('copies a link that holds the setup, and shows it', async () => {
    const user = userEvent.setup()
    render(<SetupTransfer />)
    await user.click(screen.getByText('Share and back up'))
    await user.click(screen.getByRole('button', { name: 'Copy a link to this setup' }))

    const shown = (screen.getByRole('textbox', { name: 'Link to this setup' }) as HTMLInputElement)
      .value
    expect(await screen.findByText('Link copied.')).toBeTruthy()
    expect(await navigator.clipboard.readText()).toBe(shown)
    const decoded = decodeSetup(new URL(shown).searchParams.get('s')!)!
    expect(decoded.name).toBe('Indoor bow')
    expect(decoded.arrow).toEqual(mine.arrow)
  })

  it('says to copy by hand when the browser will not copy', async () => {
    render(<SetupTransfer />)
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined })
    await userEvent.click(screen.getByRole('button', { name: 'Copy a link to this setup' }))
    expect(screen.getByText(/copy it by hand/)).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Link to this setup' })).toBeTruthy()
  })
})

describe('opening a link', () => {
  it('offers the setup and opens it only when asked', async () => {
    window.history.replaceState(null, '', `/?s=${encodeSetup(theirs)}`)
    render(<App />)
    expect(screen.getByText('This link carries a setup: Coach')).toBeTruthy()
    // Nothing is replaced yet.
    expect(working().name).toBe('Indoor bow')

    await userEvent.click(screen.getByRole('button', { name: 'Open it' }))
    expect(working().name).toBe('Coach')
    expect(working().arrow.spine).toBe(900)
    expect(screen.queryByText(/This link carries/)).toBeNull()
    // A reload must not offer it again.
    expect(window.location.search).toBe('')
  })

  it('leaves the setup on screen alone when turned down', async () => {
    window.history.replaceState(null, '', `/?s=${encodeSetup(theirs)}`)
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Not now' }))
    expect(working()).toBe(mine)
    expect(window.location.search).toBe('')
    expect(screen.queryByText(/This link carries/)).toBeNull()
  })

  it('says so when the link cannot be read', async () => {
    window.history.replaceState(null, '', '/?s=broken')
    render(<App />)
    expect(screen.getByText('This link does not hold a setup that can be read.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Open it' })).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(window.location.search).toBe('')
  })

  it('shows nothing for a plain address', () => {
    render(<App />)
    expect(screen.queryByText(/This link/)).toBeNull()
  })
})

describe('backup file', () => {
  const file = (text: string) => new File([text], 'setups.json', { type: 'application/json' })

  it('adds the setups of a file to the saved ones', async () => {
    render(<SetupTransfer />)
    await userEvent.upload(
      screen.getByLabelText('File of setups to import'),
      file(exportSetups([mine, theirs])),
    )
    expect(await screen.findByText('2 setups added.')).toBeTruthy()
    expect(saved().map((setup) => setup.name)).toEqual(['Indoor bow', 'Coach'])
    // The setup on screen is not touched.
    expect(working()).toBe(mine)
  })

  it('says what was already there and what could not be read', async () => {
    useLibraryStore.setState({ saved: [mine] })
    render(<SetupTransfer />)
    await userEvent.upload(
      screen.getByLabelText('File of setups to import'),
      file(JSON.stringify({ setups: [mine, theirs, { name: 'nothing' }] })),
    )
    expect(
      await screen.findByText('1 setup added. 1 already saved. 1 could not be read.'),
    ).toBeTruthy()
  })

  it('refuses a file that is not from this app', async () => {
    render(<SetupTransfer />)
    await userEvent.upload(screen.getByLabelText('File of setups to import'), file('hello'))
    expect(await screen.findByText('That file does not hold setups from this app.')).toBeTruthy()
    expect(saved()).toEqual([])
  })

  it('writes the saved setups and the one on screen to a file', async () => {
    let written: Blob | undefined
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: (blob: Blob) => {
        written = blob
        return 'blob:test'
      },
      revokeObjectURL: () => {},
    })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    useLibraryStore.setState({ saved: [theirs] })
    render(<SetupTransfer />)

    await userEvent.click(screen.getByRole('button', { name: 'Export to a file' }))
    expect(click).toHaveBeenCalledOnce()
    expect(screen.getByText('2 setups written to the file.')).toBeTruthy()
    const names = (JSON.parse(await written!.text()) as { setups: { name: string }[] }).setups.map(
      (setup) => setup.name,
    )
    expect(names).toEqual(['Coach', 'Indoor bow'])
    click.mockRestore()
  })
})
