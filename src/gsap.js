// Single place to register GSAP plugins so every module shares one instance.
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)
// Phones: the address bar showing/hiding resizes the viewport — don't re-measure
// every pin for that (it causes a visible jump mid-scroll).
ScrollTrigger.config({ ignoreMobileResize: true })
if (import.meta.env.DEV) window.__gsap = { gsap, ScrollTrigger } // QA handle

export { gsap, ScrollTrigger, useGSAP }
