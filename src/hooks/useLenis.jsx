import { createContext, useContext, useEffect, useState } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '../gsap'

const LenisContext = createContext(null)

/**
 * Smooth inertial scrolling, driven by GSAP's ticker so Lenis and
 * ScrollTrigger share one clock (no double rAF, no drift between them).
 */
export function LenisProvider({ enabled = true, children }) {
  const [lenis, setLenis] = useState(null)

  useEffect(() => {
    if (!enabled) return

    const instance = new Lenis({
      lerp: 0.085, // lower = heavier glide
      wheelMultiplier: 0.9,
      smoothWheel: true,
    })

    instance.on('scroll', ScrollTrigger.update)
    const tick = (time) => instance.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    setLenis(instance)
    if (import.meta.env.DEV) window.__lenis = instance // handy for QA: __lenis.scrollTo(y, { immediate: true })
    return () => {
      gsap.ticker.remove(tick)
      instance.destroy()
      if (import.meta.env.DEV) delete window.__lenis
      setLenis(null)
    }
  }, [enabled])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}

export const useLenis = () => useContext(LenisContext)
