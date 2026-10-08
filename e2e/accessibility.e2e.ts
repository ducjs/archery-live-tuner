import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Every screen is checked by axe against WCAG 2.2 A and AA, in light and in
// dark, on a wide screen and on a phone, at the Professional level, where
// everything is on show.

const SCREENS = [
  ['Setup', '/#setup'],
  ['Flight', '/#fly'],
  ['Target', '/#target'],
  ['Analysis', '/#analysis'],
  ['How it works', '/#how'],
  ['Guide', '/#guide'],
  ['Privacy', '/#privacy'],
  ['Roadmap', '/#roadmap'],
] as const

const VIEWS = [
  ['light', 'wide', { width: 1280, height: 900 }],
  ['dark', 'wide', { width: 1280, height: 900 }],
  ['light', 'phone', { width: 400, height: 800 }],
  ['dark', 'phone', { width: 400, height: 800 }],
] as const

for (const [scheme, size, viewport] of VIEWS) {
  test.describe(`${scheme} colors, ${size} screen`, () => {
    test.use({ colorScheme: scheme, viewport, hasTouch: size === 'phone' })

    for (const [name, address] of SCREENS) {
      test(`${name} has nothing axe objects to`, async ({ page }) => {
        // The level is set before the page opens, as a returning user has it.
        await page.addInitScript(() => {
          const stored = JSON.parse(localStorage.getItem('tuner.ui') ?? '{"state":{},"version":0}')
          stored.state.mode = 'pro'
          localStorage.setItem('tuner.ui', JSON.stringify(stored))
        })
        await page.goto(address)
        await expect(page.getByRole('main')).toBeVisible()
        // The callouts of the 3D bow fade in once the view stands still.
        await page.waitForTimeout(800)

        const { violations } = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
        const found = violations.map(
          ({ id, help, nodes }) => `${id}: ${help} (${nodes.length}) ${nodes[0]?.target.join(' ')}`,
        )
        expect(found).toEqual([])
      })
    }
  })
}
