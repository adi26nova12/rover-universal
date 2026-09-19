import { gsap, ScrollTrigger } from '../gsap'
import { motion, poses } from './shoes'

/**
 * Scroll choreography engine.
 *
 * Each shoe has an ordered list of keyframes pinned to page landmarks:
 *   { at: ['#card1', 'top top'], pose: { x, y, size, rotX, rotY, rotZ, layer }, ease }
 *   { at: [...], anchor: '#card1 .card__slot', fit: 0.9, pose: { rot*, layer } }
 *
 * `at` uses ScrollTrigger's start syntax, so pinned sections resolve correctly.
 * An `anchor` keyframe maps the shoe onto a DOM element's box every frame
 * (that's how shoes drop into the #01‒#04 cards). Between keyframes values are
 * blended with the segment's ease; the layer switches at the start keyframe.
 */
const NUM = ['x', 'y', 'size', 'rotX', 'rotY', 'rotZ']

function resolve(kf) {
  if (!kf.anchor) return kf.pose
  const el = typeof kf.anchor === 'string' ? document.querySelector(kf.anchor) : kf.anchor
  if (!el) return kf.pose
  const r = el.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  // `pinned`: aim for where the box sits once its section is pinned at the top,
  // so the shoe waits in place and the card rises around it (no dip/chase).
  let top = r.top
  if (kf.pinned) {
    const section = el.closest(kf.pinned)
    if (section) top = r.top - section.getBoundingClientRect().top
  }
  return {
    ...kf.pose,
    x: (r.left + r.width / 2) / vw - 0.5,
    y: 0.5 - (top + r.height / 2) / vh,
    size: (Math.max(r.height, r.width * 0.8) / vh) * (kf.fit ?? 0.9),
  }
}

/** '#hero' + 'top -60%' → scroll px, measured from that section's own pin. */
function pinnedStart(pin, start) {
  const [edge, pos] = start.split(' ')
  const vh = window.innerHeight
  const at = pos === 'top' ? 0 : pos === 'center' ? 50 : pos === 'bottom' ? 100 : parseFloat(pos)
  const base = edge === 'top' ? pin.start : pin.start + pin.trigger.offsetHeight
  return base - (at / 100) * vh
}

/**
 * @param spec  per-shoe keyframes (see spec.js)
 * @param pins  { '#hero': ScrollTrigger, ... } — keyframes on a pinned section are
 *              measured from its pin (a trigger created on a pinned element after
 *              the pin would be offset by the pin's own length).
 */
export function buildChoreo(spec, pins = {}) {
  const tracks = Object.entries(spec).map(([id, keys]) => ({
    id,
    keys: keys.map((k) => {
      const pin = pins[k.at[0]]
      return {
        ...k,
        ease: gsap.parseEase(k.ease ?? 'power1.inOut'),
        st: pin
          ? { get start() { return pinnedStart(pin, k.at[1]) }, kill() {} }
          : // dummy trigger: only measures where this keyframe sits in scroll space
            ScrollTrigger.create({ trigger: k.at[0], start: k.at[1], refreshPriority: -2 }),
      }
    }),
  }))

  let lastY = window.scrollY
  let appliedY = NaN // skip the pose pass while the page isn't moving
  const remeasure = () => (appliedY = NaN)
  ScrollTrigger.addEventListener('refresh', remeasure)
  const apply = () => {
    const y = window.scrollY
    // momentum: px per frame → −1‒1, eased so a flick swings the shoes and settles
    const v = gsap.utils.clamp(-1, 1, (y - lastY) / 60)
    motion.vel += (v - motion.vel) * 0.12
    if (Math.abs(motion.vel) < 1e-4) motion.vel = 0
    lastY = y
    if (y === appliedY) return
    appliedY = y
    let tracking = false // an anchor keyframe follows a DOM box that may still be animating
    for (const { id, keys } of tracks) {
      const pose = poses[id]
      let i = keys.findIndex((k) => k.st.start > y)
      if (i === -1) i = keys.length
      if (i === 0 || i === keys.length) {
        Object.assign(pose, resolve(keys[i === 0 ? 0 : keys.length - 1]))
        continue
      }
      const a = keys[i - 1]
      const b = keys[i]
      if (a.anchor || b.anchor) tracking = true
      const span = Math.max(1, b.st.start - a.st.start)
      const t = b.ease(gsap.utils.clamp(0, 1, (y - a.st.start) / span))
      const pa = resolve(a)
      const pb = resolve(b)
      for (const k of NUM) pose[k] = pa[k] + (pb[k] - pa[k]) * t
      pose.layer = t < 0.5 ? pa.layer : pb.layer // layer flips halfway through a segment
    }
    if (tracking) appliedY = NaN
  }

  gsap.ticker.add(apply)
  apply()
  // QA: mirror state into the DOM (readable from isolated automation worlds)
  let dbg
  if (import.meta.env.DEV) {
    dbg = setInterval(() => {
      document.body.dataset.choreo = JSON.stringify({
        y: Math.round(window.scrollY),
        poses: Object.fromEntries(Object.entries(poses).map(([k, v]) => [k, [+v.x.toFixed(2), +v.y.toFixed(2), +v.size.toFixed(2), v.layer]])),
        starts: Object.fromEntries(tracks.map((t) => [t.id, t.keys.map((k) => Math.round(k.st.start))])),
        triggers: ScrollTrigger.getAll().filter((s) => s.pin).map((s) => [s.trigger.id, Math.round(s.start), Math.round(s.end)]),
      })
    }, 400)
  }
  return () => {
    clearInterval(dbg)
    gsap.ticker.remove(apply)
    ScrollTrigger.removeEventListener('refresh', remeasure)
    tracks.forEach((t) => t.keys.forEach((k) => k.st.kill()))
  }
}
