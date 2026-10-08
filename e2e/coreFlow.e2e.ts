import { expect, test, type Page } from '@playwright/test'

// The core flow of spec §33, on the built site: enter a setup, see the result
// change, try a suggestion, save, compare, and find it all again after a reload.

const sentence = (page: Page) => page.locator('p.text-lg').first()

/** Opens a group of values, if it is folded. */
async function openGroup(page: Page, group: string) {
  const toggle = page.locator(`#${group}-heading button`)
  if ((await toggle.getAttribute('aria-expanded')) === 'false') await toggle.click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('starts on Setup at the Basic level, with three groups of values', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Setup', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByRole('radio', { name: 'Basic' })).toBeChecked()
  for (const group of ['bow', 'tuning', 'arrow']) {
    await expect(page.locator(`#${group}-heading`)).toBeVisible()
  }
  await expect(page.locator('#string-heading')).toHaveCount(0)
  // Basic offers the two workspaces that need nothing else.
  await expect(page.getByRole('navigation', { name: 'Workspace' }).getByRole('link')).toHaveText([
    'Setup',
    'Flight',
  ])
})

test('a heavier point makes the arrow read weak, as the value is changed', async ({ page }) => {
  await expect(sentence(page)).toContainText('matches the bow')
  await openGroup(page, 'arrow')
  const pointWeight = page.getByRole('spinbutton', { name: /Point weight/ })
  await pointWeight.fill('200')
  await pointWeight.blur()
  await expect(sentence(page)).toContainText('weak')
  // The folded group says what is in it, and that something was changed.
  await page.locator('#arrow-heading button').click()
  await expect(page.locator('#arrow-heading')).toContainText('200 gr')
  await expect(page.locator('#arrow-heading')).toContainText('1 changed')
})

test('a value opens to its slider when it is in use, and steps with its buttons', async ({
  page,
}) => {
  const drawWeight = page.getByRole('spinbutton', { name: /Draw weight/ })
  await expect(page.getByRole('slider', { name: 'Draw weight slider' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Increase Draw weight' }).click()
  await expect(drawWeight).toHaveValue('38.5')
  await expect(page.getByRole('slider', { name: 'Draw weight slider' })).toBeVisible()
  await page.getByRole('button', { name: /Reset Draw weight/ }).click()
  await expect(drawWeight).toHaveValue('38.0')
})

test('the next step can be tried, and brings the setup closer to tuned', async ({ page }) => {
  await openGroup(page, 'arrow')
  const spine = page.getByRole('spinbutton', { name: /Spine/ })
  await spine.fill('800')
  await spine.blur()
  await page.getByRole('link', { name: 'Flight', exact: true }).click()

  const nextStep = page.getByRole('region', { name: 'Next step' })
  const before = await nextStep.innerText()
  await nextStep.getByRole('button', { name: /Try it/ }).click()
  // The value was taken: what is next now is another step, or another value of it.
  await expect.poll(() => nextStep.innerText()).not.toBe(before)
})

test('the result keeps its detail in tabs, and more of them at a higher level', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'Flight', exact: true }).click()
  const tabs = page.getByRole('tablist', { name: 'Detail of the result' }).getByRole('tab')
  await expect(tabs).toHaveText(['Gauges', 'Bare shaft'])
  await page.getByRole('radio', { name: 'Professional' }).check({ force: true })
  await expect(tabs).toHaveText(['Gauges', 'Bare shaft', 'Paper tear', 'Numbers', 'Draw curve'])
  await page.getByRole('tab', { name: 'Numbers' }).click()
  await expect(page.getByRole('tabpanel')).toContainText('Front of center')
  // The arrow keys move between the tabs.
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Draw curve' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})

test('a higher level adds workspaces and groups, and a lower one says what it hides', async ({
  page,
}) => {
  await page.getByRole('radio', { name: 'Advanced' }).check({ force: true })
  await expect(page.getByRole('navigation', { name: 'Workspace' }).getByRole('link')).toHaveText([
    'Setup',
    'Flight',
    'Target',
    'Analysis',
  ])
  await openGroup(page, 'balance')
  const bowMass = page.getByRole('spinbutton', { name: /Bow mass/ })
  await bowMass.fill('3.5')
  await bowMass.blur()

  await page.getByRole('radio', { name: 'Basic' }).check({ force: true })
  await expect(page.locator('#balance-heading')).toHaveCount(0)
  await expect(page.getByText('1 value above this level is changed')).toBeVisible()
  await page.getByRole('button', { name: 'Reset them' }).click()
  await expect(page.getByText(/above this level/)).toHaveCount(0)
})

test('an address of a workspace above the level raises the level', async ({ page }) => {
  await page.goto('/#target')
  await expect(page.getByRole('radio', { name: 'Advanced' })).toBeChecked()
  await expect(page.getByRole('link', { name: 'Target', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByRole('heading', { name: 'Reading the target' })).toBeVisible()
})

test('a saved setup is compared with the changed one, and both survive a reload', async ({
  page,
}) => {
  await page.getByRole('radio', { name: 'Advanced' }).check({ force: true })
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible()

  await page.getByRole('button', { name: 'Increase Draw weight' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Unsaved changes' })).toBeVisible()

  await page.getByRole('link', { name: 'Analysis', exact: true }).click()
  const table = page.getByRole('region', { name: 'What differs' })
  await expect(table).toContainText('Draw weight')
  await expect(table).toContainText('38.0 lb')
  await expect(table).toContainText('38.5 lb')

  await page.reload()
  await expect(page.getByRole('link', { name: 'Analysis', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByRole('button', { name: 'Setups (1)' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'What differs' })).toContainText('38.5 lb')
})

test('the callout of a part of the 3D bow goes to its value', async ({ page }) => {
  const callout = page.getByRole('button', { name: 'Press to set: Nocking point' })
  await expect(callout).toBeVisible()
  await callout.click()
  await expect(page.locator('#tuning-heading button')).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('slider', { name: 'Nocking point height slider' })).toBeFocused()
  // Close on one part, the way back to the whole bow is offered, and takes it.
  await page.getByRole('button', { name: 'Whole bow' }).first().click()
  await expect(page.getByRole('button', { name: 'Press to set: Stabilizer' })).toBeVisible()
})

test('the 3D bow can be switched off, and the flight drawn beside the values', async ({ page }) => {
  await page.getByRole('checkbox', { name: 'Bow 3D' }).uncheck({ force: true })
  await expect(page.getByRole('button', { name: /Press to set/ })).toHaveCount(0)
  await page.getByRole('radio', { name: 'From the side' }).check({ force: true })
  await expect(page.getByRole('img', { name: /side/i }).first()).toBeVisible()
  await page.reload()
  await expect(page.getByRole('checkbox', { name: 'Bow 3D' })).not.toBeChecked()
  await expect(page.getByRole('radio', { name: 'From the side' })).toBeChecked()
})

test('language and units are behind the settings button', async ({ page }) => {
  await page.getByText('Settings').click()
  await page.getByRole('radio', { name: 'kg, cm, g' }).check({ force: true })
  await expect(page.getByRole('spinbutton', { name: /Draw weight/ })).toHaveValue('17.2')
  await page.getByRole('radio', { name: 'Tiếng Việt' }).check({ force: true })
  await expect(page.getByRole('link', { name: 'Tên bay', exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
})

test('the pages beside the simulator open from the top bar', async ({ page }) => {
  await page.getByRole('link', { name: 'How it works' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tool này hoạt động thế nào')
  // A step links back into the simulator.
  await page.getByRole('link', { name: 'Tên bay', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Model result' })).toBeVisible()
})

test('a keyboard can skip the bars, and Escape closes the settings', async ({ page }) => {
  await page.keyboard.press('Tab')
  const skip = page.getByRole('button', { name: 'Skip to the content' })
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()

  await page.getByText('Settings').click()
  await expect(page.getByRole('radio', { name: 'kg, cm, g' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('radio', { name: 'kg, cm, g' })).toBeHidden()
})

test('the guide and the privacy page open, and the guide leads into the simulator', async ({
  page,
}) => {
  await page.getByRole('navigation', { name: 'Pages' }).getByRole('link', { name: 'Guide' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hướng dẫn sử dụng')
  await page.getByRole('link', { name: 'Mở Tên bay' }).first().click()
  await expect(page.getByRole('heading', { name: 'Model result' })).toBeVisible()

  await page.getByRole('contentinfo').last().getByRole('link', { name: 'Privacy' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quyền riêng tư')
  // What the page says is kept is what is kept.
  const keys = await page.evaluate(() => Object.keys(localStorage))
  for (const key of keys) await expect(page.getByRole('table')).toContainText(key)
})
