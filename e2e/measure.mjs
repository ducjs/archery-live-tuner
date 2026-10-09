// Measures the built site as a slow phone would run it: a 400 px screen and a
// processor held to a sixth of this machine's speed. Not a test; it prints
// numbers to compare before and after a change.
//
//   npx vite build && npx vite preview --port 4173 &
//   node e2e/measure.mjs
import { chromium } from '@playwright/test'

const URL = process.env.MEASURE_URL ?? 'http://localhost:4173/'
const SLOWDOWN = Number(process.env.MEASURE_SLOWDOWN ?? 6)

async function run(label, { bow3d }) {
  const browser = await chromium.launch({
    channel: 'chrome',
    args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
  })
  const context = await browser.newContext({
    viewport: { width: 400, height: 800 },
    hasTouch: true,
    locale: 'en-US',
  })
  const page = await context.newPage()
  await page.addInitScript((shown) => {
    if (localStorage.getItem('tuner.ui')) return
    localStorage.setItem(
      'tuner.ui',
      JSON.stringify({ state: { bow3d: shown, flightPreview: 'off' }, version: 0 }),
    )
  }, bow3d)
  const session = await context.newCDPSession(page)
  await session.send('Emulation.setCPUThrottlingRate', { rate: SLOWDOWN })
  await page.addInitScript(() => {
    window.__long = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__long += entry.duration
    }).observe({ type: 'longtask', buffered: true })
  })

  const started = Date.now()
  await page.goto(URL)
  await page.locator('#attributes-heading').waitFor()
  const readable = Date.now() - started
  const plus = page.getByRole('button', { name: 'Increase Draw weight' })
  await plus.waitFor()
  const usable = Date.now() - started
  if (bow3d) await page.getByRole('button', { name: 'Press to set: Riser' }).waitFor()
  const settled = Date.now() - started

  // One step of a value, timed in the page: until React has answered the press
  // (the value and the reading are new), and until the frame after is drawn.
  const answered = []
  const drawn = []
  for (let index = 0; index < 20; index++) {
    const [first, second] = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const button = document.querySelector('button[aria-label="Increase Draw weight"]')
          const from = performance.now()
          button.click()
          const answer = performance.now() - from
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve([answer, performance.now() - from])),
          )
        }),
    )
    answered.push(first)
    drawn.push(second)
    await page.waitForTimeout(250)
  }
  const median = (values) => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)]
  const long = await page.evaluate(() => window.__long)
  const transferred = await page.evaluate(() =>
    performance.getEntriesByType('resource').reduce((sum, entry) => sum + entry.encodedBodySize, 0),
  )
  await browser.close()
  const ms = (value) => `${String(Math.round(value)).padStart(5)} ms`
  console.log(
    `${label.padEnd(11)} readable${ms(readable)}  usable${ms(usable)}  settled${ms(settled)}  step answered${ms(median(answered))}  drawn${ms(median(drawn))}  long tasks${ms(long)}  ${(transferred / 1024).toFixed(0)} kB`,
  )
}

console.log(`processor slowed ${SLOWDOWN} times, 400 px wide`)
await run('3D bow on', { bow3d: true })
await run('3D bow off', { bow3d: false })
