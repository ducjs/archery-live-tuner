// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultSetup } from '../models/setup.ts'
import { SETUPS_KEY, createLocalStorageRepository } from './localStorageRepository.ts'

beforeEach(() => localStorage.clear())

describe('localStorage repository', () => {
  it('starts empty', async () => {
    expect(await createLocalStorageRepository().list()).toEqual([])
  })

  it('saves setups and gives them back in the order they were saved', async () => {
    const repository = createLocalStorageRepository()
    const a = createDefaultSetup('A')
    const b = createDefaultSetup('B')
    await repository.save(a)
    await repository.save(b)
    expect(await repository.list()).toEqual([a, b])
    // A second repository reads the same storage.
    expect(await createLocalStorageRepository().list()).toEqual([a, b])
  })

  it('replaces a setup that has the same id', async () => {
    const repository = createLocalStorageRepository()
    const a = createDefaultSetup('A')
    await repository.save(a)
    await repository.save(createDefaultSetup('B'))
    await repository.save({ ...a, name: 'A, renamed' })
    expect((await repository.list()).map((setup) => setup.name)).toEqual(['A, renamed', 'B'])
  })

  it('removes a setup', async () => {
    const repository = createLocalStorageRepository()
    const a = createDefaultSetup('A')
    const b = createDefaultSetup('B')
    await repository.save(a)
    await repository.save(b)
    await repository.remove(a.id)
    expect(await repository.list()).toEqual([b])
  })

  it('leaves out stored entries that are not valid setups', async () => {
    const good = createDefaultSetup('Good')
    const outOfBounds = { ...good, id: 'x', arrow: { ...good.arrow, spine: 5 } }
    localStorage.setItem(SETUPS_KEY, JSON.stringify([good, outOfBounds, 'nonsense', null]))
    expect(await createLocalStorageRepository().list()).toEqual([good])
  })

  it('treats unreadable storage content as empty', async () => {
    localStorage.setItem(SETUPS_KEY, '{not json')
    expect(await createLocalStorageRepository().list()).toEqual([])
    localStorage.setItem(SETUPS_KEY, '{"a":1}')
    expect(await createLocalStorageRepository().list()).toEqual([])
  })

  it('reports a storage that cannot be written', async () => {
    const full = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota')
      },
    } as unknown as Storage
    await expect(
      createLocalStorageRepository(() => full).save(createDefaultSetup()),
    ).rejects.toThrow('quota')
  })
})
