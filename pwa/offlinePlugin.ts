import { createHash } from 'node:crypto'
import { readdirSync } from 'node:fs'
import type { Plugin } from 'vite'

// Makes the built site work without a network (spec §34.8): a service worker
// that keeps a copy of every file of the build. It is written here, not taken
// from a library, because all it needs is the list of files, and the build is
// the only place that knows their hashed names.

/**
 * The service worker. `FILES` and `VERSION` are filled in at build time.
 *
 * Files of the build are served from the copy first: their names carry a hash,
 * so a copy never goes stale. The page itself is asked from the network first,
 * so a new version arrives as soon as there is a connection, and comes from
 * the copy when there is none.
 */
const SERVICE_WORKER = `const VERSION = __VERSION__
const FILES = __FILES__
const CACHE = 'tuner-' + VERSION
// A server may answer with "Vary: Origin", and the page asks for its scripts in
// another way than this worker did when it stored them. The names are enough.
const COPY = { cacheName: CACHE, ignoreVary: true }

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith('tuner-') && name !== CACHE)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only a good answer replaces the copy; an error page from the host must not.
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put('./', copy))
          }
          return response
        })
        .catch(() => caches.match('./', COPY)),
    )
    return
  }

  event.respondWith(
    caches.match(request, COPY).then((copy) => copy || fetch(request)),
  )
})
`

/** Emits `sw.js` next to `index.html`, listing every file of the build and of `public/`. */
export function offline(): Plugin {
  return {
    name: 'tuner:offline',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const built = Object.keys(bundle).filter((name) => name !== 'index.html')
      const copied = readdirSync('public')
      // './' is the page; the rest is relative to it, like every address of the build.
      const files = ['./', ...[...built, ...copied].sort().map((name) => `./${name}`)]
      const version = createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0, 12)
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: SERVICE_WORKER.replace('__VERSION__', JSON.stringify(version)).replace(
          '__FILES__',
          JSON.stringify(files, null, 2),
        ),
      })
    },
  }
}
