import { useCallback, useEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * Drives a looping clock with requestAnimationFrame. `elapsed` runs from 0 to
 * `flightSeconds` at `rate` times real time, waits `holdSeconds` at the end,
 * then starts over. Does not start by itself when the user asks for reduced
 * motion.
 */
export function usePlayback(flightSeconds: number, holdSeconds: number, rate: number) {
  const [position, setPosition] = useState(0)
  const [playing, setPlaying] = useState(() => !prefersReducedMotion())
  const settings = useRef({ flightSeconds, holdSeconds, rate })

  useEffect(() => {
    settings.current = { flightSeconds, holdSeconds, rate }
  }, [flightSeconds, holdSeconds, rate])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let previous: number | null = null
    const tick = (now: number) => {
      // Cap the step so a background tab does not jump the animation on return.
      const delta = previous === null ? 0 : Math.min(0.1, (now - previous) / 1000)
      previous = now
      setPosition((current) => {
        const { flightSeconds: flight, holdSeconds: hold, rate: speed } = settings.current
        // The hold at the end always takes the same time, whatever the speed.
        const next = current + (current < flight ? delta * speed : delta)
        return next >= flight + hold ? 0 : next
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  const toggle = useCallback(() => setPlaying((current) => !current), [])
  const restart = useCallback(() => {
    setPosition(0)
    setPlaying(true)
  }, [])

  return { elapsed: Math.min(position, flightSeconds), playing, toggle, restart }
}
