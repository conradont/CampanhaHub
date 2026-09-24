import { useEffect, useRef, useState } from "react"

export function useCountUp(target: number, duration = 500) {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const delta = target - from
    if (delta === 0) return

    const start = performance.now()
    const ease = (progress: number) => 1 - (1 - progress) ** 3

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setValue(from + delta * ease(progress))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return value
}
