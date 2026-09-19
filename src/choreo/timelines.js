import { gsap, ScrollTrigger } from '../gsap'
import { SHOES, intro } from './shoes'
import { buildChoreo } from './engine'
import { buildSpec } from './spec'

const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => gsap.utils.toArray(sel, root)

/** Wrap every word of an element's text nodes in <span class="w"> (once). */
function splitWords(el) {
  if (!el || el.dataset.split) return
  el.dataset.split = '1'
  const walk = (node) => {
    ;[...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment()
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return
          if (/^\s+$/.test(part)) frag.append(part)
          else {
            const s = document.createElement('span')
            s.className = 'w'
            s.textContent = part
            frag.append(s)
          }
        })
        n.replaceWith(frag)
      } else if (n.nodeType === 1 && n.tagName !== 'IMG') walk(n)
    })
  }
  walk(el)
}

/** Mask-reveal a block's lines on scroll (in from below, out through the top). */
function lines(section, { inStart = 'top 85%', inEnd = 'top 25%', out = true } = {}) {
  const inner = $$('.line__inner', section)
  gsap.fromTo(
    inner,
    { yPercent: 110 },
    { yPercent: 0, ease: 'power3.out', stagger: 0.12, scrollTrigger: { trigger: section, start: inStart, end: inEnd, scrub: 1 } },
  )
  if (out)
    gsap.to(inner, {
      yPercent: -110,
      ease: 'power2.in',
      stagger: 0.08,
      immediateRender: false,
      scrollTrigger: { trigger: section, start: 'bottom 55%', end: 'bottom 5%', scrub: 1 },
    })
}

/**
 * Everything scroll-driven, in DOM order. Within a pinned section its own
 * animations are created *before* its pin (triggers on a pinned element that
 * are created after the pin get offset by the pin length); the shoe
 * choreography goes last and measures pinned sections from their pins.
 */
export function buildSite({ isMobile, reduced }) {
  const pins = {}
  const pin = (id, len) =>
    (pins[id] = ScrollTrigger.create({ trigger: id, start: 'top top', end: `+=${len}%`, pin: true, pinSpacing: true, anticipatePin: 1 }))

  /* HERO — pinned; wordmark gives way to the giant title, satellites fly out */
  const hero = $('#hero')
  gsap
    .timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: '+=150%', scrub: 1 } })
    .to('.hero__wordmark', { autoAlpha: 0, y: -20, duration: 0.2 }, 0)
    .fromTo('.hero__title .line__inner', { yPercent: 110, y: 0 }, { yPercent: 0, stagger: 0.08, duration: 0.35, ease: 'power3.out' }, 0.05)
    .fromTo('.hero__sub .line__inner', { yPercent: 110, y: 0 }, { yPercent: 0, duration: 0.25, ease: 'power3.out' }, 0.25)
    .fromTo('.hero__para', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, stagger: 0.03, duration: 0.2 }, 0.3)
    .to('.hero__title .line__inner', { yPercent: -110, stagger: 0.06, duration: 0.3, ease: 'power2.in' }, 0.72)
    .to('.hero__sub .line__inner', { yPercent: -110, duration: 0.2, ease: 'power2.in' }, 0.74)
    .to('.hero__para', { autoAlpha: 0, duration: 0.15 }, 0.78)
  pin('#hero', 150)

  /* STATEMENT — words light up as you read */
  const statement = $('.statement__text')
  splitWords(statement)
  gsap.fromTo(
    $$('.w', statement),
    { opacity: 0.12 },
    { opacity: 1, stagger: 0.02, ease: 'none', scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 45%', scrub: 1 } },
  )
  gsap.fromTo('.statement .micro', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, stagger: 0.1, scrollTrigger: { trigger: '.statement .cols', start: 'top 90%', end: 'top 60%', scrub: 1 } })

  /* CHAPTERS + CARDS */
  const chapterFx = (id) => {
    const el = $(id)
    const len = el.classList.contains('chapter--marquee') ? 120 : el.id === 'ch1' ? 100 : 0
    lines(el, { inStart: 'top 90%', inEnd: 'top 20%', out: !len })
    gsap.fromTo($$('.micro, .col-title, .tag, .shout, .chapter__kicker, .chapter__num', el), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: 0.06, scrollTrigger: { trigger: el, start: 'top 60%', end: 'top 10%', scrub: 1 } })
    if (len) {
      // pinned chapters leave by lifting their lines through the mask
      gsap.to($$('.line__inner', el), { yPercent: -110, stagger: 0.05, ease: 'power2.in', immediateRender: false, scrollTrigger: { trigger: el, start: `top -${len - 35}%`, end: `top -${len}%`, scrub: 1 } })
      gsap.to($$('.micro, .col-title, .tag, .chapter__kicker, .chapter__num', el), { autoAlpha: 0, immediateRender: false, scrollTrigger: { trigger: el, start: `top -${len - 30}%`, end: `top -${len}%`, scrub: 1 } })
    }
    if (el.classList.contains('chapter--marquee')) {
      gsap.fromTo($('.marquee__track', el), { xPercent: 0 }, { xPercent: -50, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: `top -${len}%`, scrub: 1 } })
    }
    if (len) pin(id, len)
  }
  const cardFx = (n) => {
    const id = `#card${n}`
    const el = $(id)
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 60%', end: '+=190%', scrub: 1 } })
    tl.fromTo($('.card', el), { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.18 }, 0)
      .fromTo($$('.card__list li, .barcode', el), { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, stagger: 0.01, duration: 0.1 }, 0.2)
      // collapse into the tiny #0N box (like the reference)
      .to($('.card', el), { scale: 0.16, autoAlpha: 0, duration: 0.22, ease: 'power3.in' }, 0.68)
      .fromTo($('.card__mini', el), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.08 }, 0.82)
      .to($('.card__mini', el), { autoAlpha: 0, duration: 0.08 }, 0.96)
    pin(id, 130)
  }
  chapterFx('#ch1')
  cardFx(1)
  chapterFx('#ch2')
  cardFx(2)
  chapterFx('#ch3')
  cardFx(3)
  chapterFx('#ch4')
  cardFx(4)

  /* CONTACT */
  lines($('#contact'), { inStart: 'top 90%', inEnd: 'top 30%', out: false })
  gsap.fromTo('.contact__para, .footer > *', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: 0.05, scrollTrigger: { trigger: '#contact', start: 'top 50%', end: 'top 0%', scrub: 1 } })

  /* SHOES — choreography last, so every landmark is measured after the pins */
  const stopChoreo = buildChoreo(buildSpec({ isMobile }), pins)
  if (reduced) SHOES.forEach((s) => Object.assign(intro[s.id], { dy: 0, rx: 0, ry: 0, rz: 0 }))
  return stopChoreo
}

/** The opening: objects drop in with gravity, overshoot a hair, and settle. */
export function playFall() {
  const tl = gsap.timeline()
  SHOES.forEach((s, i) => {
    const o = intro[s.id]
    const spin = () => gsap.utils.random(-3.2, 3.2)
    gsap.set(o, { dy: 1.25 + i * 0.12, rx: spin(), ry: spin(), rz: spin() })
    const at = 0.15 + [0.35, 0, 0.55, 0.2, 0.7][i]
    tl.to(o, { dy: -0.025, duration: 1.05, ease: 'power2.in' }, at)
      .to(o, { dy: 0, duration: 1.2, ease: 'elastic.out(1, 0.45)' }, at + 1.05)
      .to(o, { rx: 0, ry: 0, rz: 0, duration: 2.6, ease: 'power3.out' }, at)
  })
  return tl
}
