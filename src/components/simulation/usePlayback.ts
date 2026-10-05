import { useCallback, useEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * Drives a looping clock with requestAnimationFrame. `elapsed` is in seconds of
 * wall-clock time and wraps at `loopSeconds`. Does not start by itself when the
 * user asks for reduced motion.
 */
export function usePlayback(loopSeconds: number) {
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(() => !prefersReducedMotion())
  const loopRef = useRef(loopSeconds)

  useEffect(() => {
    loopRef.current = loopSeconds
  }, [loopSeconds])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let previous: number | null = null
    const tick = (now: number) => {
      // Cap the step so a background tab does not jump the animation on return.
      const delta = previous === null ? 0 : Math.min(0.1, (now - previous) / 1000)
      previous = now
      setElapsed((current) => (current + delta) % loopRef.current)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  const toggle = useCallback(() => setPlaying((current) => !current), [])
  const restart = useCallback(() => {
    setElapsed(0)
    setPlaying(true)
  }, [])

  return { elapsed: Math.min(elapsed, loopSeconds), playing, toggle, restart }
}
