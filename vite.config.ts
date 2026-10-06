import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { offline } from './pwa/offlinePlugin.ts'

// https://vite.dev/config/
export default defineConfig({
  // Relative paths, so the build works under any address, such as
  // user.github.io/repo/. Pages are picked by the # part, which needs no base.
  base: './',
  plugins: [react(), tailwindcss(), offline()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    // The tests that render the whole app take a second or two each, and more
    // when every file runs at once; the default of five seconds was too close.
    testTimeout: 20_000,
  },
})
