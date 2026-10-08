import { defineConfig } from '@playwright/test'

const PORT = 4173

// End-to-end tests of the built site, in the Chrome that is already installed.
// Run with `npm run e2e`; it builds first.
export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts',
  fullyParallel: true,
  // Each page draws the 3D bow in software; too many at once and Chrome gives up.
  workers: 4,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'chrome',
    locale: 'en-US',
    viewport: { width: 1280, height: 900 },
    launchOptions: {
      // The 3D bow needs WebGL, which a machine without a graphics card draws in software.
      args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
    },
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
