import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { gsap, ScrollTrigger, useGSAP } from './gsap'
import { LenisProvider, useLenis } from './hooks/useLenis'
import { useReducedMotion, MOBILE_QUERY, DESKTOP_QUERY, REDUCED_QUERY } from './hooks/useMediaQuery'
import { Stage } from './scene/Stage'
import { Chrome, Site } from './components/Site'
import { buildSite, playFall } from './choreo/timelines'

/**
 * Waits for the five GLBs, shows a tiny % counter in the wordmark slot,
 * then drops the shoes in and wires every scroll animation.
 */
function Orchestrator() {
  const lenis = useLenis()
  const { progress, active, total } = useProgress()
  const [ready, setReady] = useState(false)
  const root = useRef(document.documentElement)

  // Loading readout + scroll lock
  useEffect(() => {
    const el = document.querySelector('.loader-count')
    if (el) el.textContent = `${String(Math.round(progress)).padStart(3, '0')}%`
    const done = !active && (progress === 100 || total === 0)
    if (done && !ready) {
      const id = setTimeout(() => setReady(true), 350)
      return () => clearTimeout(id)
    }
  }, [progress, active, total, ready])

  useEffect(() => {
    document.documentElement.classList.toggle('is-loading', !ready)
    if (ready) lenis?.start()
    else lenis?.stop()
  }, [ready, lenis])

  useGSAP(
    () => {
      if (!ready) return
      document.documentElement.classList.add('is-ready')
      const mm = gsap.matchMedia()
      mm.add({ isMobile: MOBILE_QUERY, isDesktop: DESKTOP_QUERY, reduced: REDUCED_QUERY }, (ctx) => {
        let stop
        try {
          stop = buildSite({ isMobile: ctx.conditions.isMobile, reduced: ctx.conditions.reduced })
        } catch (err) {
          console.error('[rovar] buildSite failed', err)
        }
        return () => stop?.()
      })
      if (!window.matchMedia(REDUCED_QUERY).matches) playFall()
      document.fonts?.ready.then(() => ScrollTrigger.refresh())
      return () => mm.revert()
    },
    { dependencies: [ready], scope: root },
  )
  return null
}

export default function App() {
  const reduced = useReducedMotion()
  return (
    <LenisProvider enabled={!reduced}>
      {/* Layers: back shoes → page type → front shoes → fixed interface */}
      <Stage reduced={reduced} />
      <Site />
      <Chrome />
      <Orchestrator />
    </LenisProvider>
  )
}
