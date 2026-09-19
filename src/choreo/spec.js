/* ─────────────────────────────────────────────────────────────────────────────
 * THE CHOREOGRAPHY — every shoe's path through the page. Retune here.
 *
 * x / y  : viewport-relative, centre = 0, right / up positive (±0.5 = edge)
 * size   : longest side as a fraction of viewport height (0.8 = dominant)
 * layer  : 'back' = behind the type, 'front' = over it
 * at     : [trigger, ScrollTrigger start] — e.g. ['#card1', 'top -80%']
 * anchor : lock onto a DOM box (card image slots) — `fit` scales within it;
 *          `pinned` aims at the box's position once its section is pinned
 *
 * The boot is the hero: it's on screen from the fall to the footer, big and
 * overlapping the giant type. The other four open the page, fly out, and each
 * returns — oversized — to headline a chapter.
 * ──────────────────────────────────────────────────────────────────────────── */

const P = (x, y, size, rotX, rotY, rotZ, layer = 'front') => ({ x, y, size, rotX, rotY, rotZ, layer })

export function buildSpec({ isMobile }) {
  // Mobile: tighter horizontal spread, smaller objects (portrait viewport).
  const m = isMobile ? { x: 0.7, s: 0.58 } : { x: 1, s: 1 }
  const p = (x, y, size, ...rest) => P(x * m.x, y, size * m.s, ...rest)
  const hidden = (x, y) => P(x, y, 0, 0, 0, 0)
  const mob = (desktop, phone) => (isMobile ? phone : desktop)

  const card = (n, spin) => [
    { at: [`#card${n}`, 'top top'], anchor: `#card${n} .card__slot`, pinned: '.card-pin', fit: 0.9, pose: { rotX: 0.15, rotY: spin, rotZ: -0.05, layer: 'front' }, ease: 'power2.out' },
    { at: [`#card${n}`, 'top -70%'], anchor: `#card${n} .card__slot`, pinned: '.card-pin', fit: 0.9, pose: { rotX: 0.05, rotY: spin + 2.2, rotZ: 0.04, layer: 'front' } },
    { at: [`#card${n}`, 'top -110%'], anchor: `#card${n} .card__mini`, pinned: '.card-pin', fit: 0.2, pose: { rotX: 0, rotY: spin + 3.4, rotZ: 0, layer: 'front' }, ease: 'power3.in' },
    { at: [`#card${n}`, 'top -125%'], anchor: `#card${n} .card__mini`, pinned: '.card-pin', fit: 0, pose: { rotX: 0, rotY: spin + 3.6, rotZ: 0, layer: 'front' } },
  ]

  return {
    boot: [
      // Hero: dominant, dead centre, cutting through ROVAR / UNIVERSAL
      { at: ['#hero', 'top top'], pose: p(0.01, mob(-0.08, -0.2), mob(0.72, 0.66), 0.22, 0.75, -0.14) },
      { at: ['#hero', 'top -60%'], pose: p(0.02, mob(-0.04, -0.2), mob(0.82, 0.7), 0.1, 1.9, -0.04), ease: 'power2.inOut' },
      { at: ['#hero', 'top -150%'], pose: p(0, mob(-0.02, -0.1), 0.7, 0.25, 3.3, 0.08) },
      // About: tumbles *behind* the justified text, still huge
      { at: ['#about', 'top 40%'], pose: p(0.14, 0.02, 0.66, 0.6, 4.4, 0.35, 'back') },
      { at: ['#about', 'bottom 60%'], pose: p(-0.1, 0.06, 0.6, -0.35, 5.8, -0.2, 'back') },
      // #01 KIDS' FOOTWEAR: slams into the middle of the type, in front
      { at: ['#ch1', 'top top'], pose: p(0, -0.03, 0.8, 0.08, 6.6, 0), ease: 'power3.out' },
      { at: ['#ch1', 'top -60%'], pose: p(0, -0.01, 0.76, 0.2, 7.3, 0.06) },
      ...card(1, 7.6),
      // Finale: the boot falls back in, centre stage
      { at: ['#contact', 'top 60%'], pose: hidden(0, 0.9) },
      { at: ['#contact', 'top top'], pose: p(0, -0.06, 0.72, 0.18, 12.4, -0.1), ease: 'power3.out' },
      // page bottom: lift clear of the footer copy
      { at: ['#contact', 'bottom bottom'], pose: mob(p(0, 0.2, 0.42, 0.22, 13.4, -0.05), P(0, 0.15, 0.15, 0.22, 13.4, -0.05)) },
    ],
    sneaker: [
      { at: ['#hero', 'top top'], pose: p(-0.3, mob(0.2, 0.34), 0.34, 0.45, -0.6, 0.55, 'back') },
      { at: ['#hero', 'top -60%'], pose: p(-0.33, mob(0.24, 0.36), 0.36, 0.7, 0.2, 0.8, 'back') },
      { at: ['#hero', 'top -150%'], pose: p(-0.95, 0.85, 0.36, 2.0, 1.6, 1.8, 'back'), ease: 'power2.in' },
      { at: ['#about', 'top top'], pose: hidden(0.8, 0.8) },
      // #02: sweeps in from the top right, oversized, across the headline
      { at: ['#ch2', 'top bottom'], pose: p(0.8, 0.8, 0.95, 1.2, -2.4, 1.1) },
      { at: ['#ch2', 'top top'], pose: p(0.2, 0.08, 0.92, 0.5, -0.5, 0.55), ease: 'power3.out' },
      { at: ['#ch2', 'bottom bottom'], pose: p(0.26, -0.04, 0.8, 0.15, 0.9, 0.25) },
      ...card(2, 1.2),
      { at: ['#contact', 'top 60%'], pose: hidden(-0.8, 0.9) },
      { at: ['#contact', 'top top'], pose: p(-0.32, 0.2, 0.3, 0.5, -0.7, 0.5, 'back'), ease: 'power3.out' },
      { at: ['#contact', 'bottom bottom'], pose: mob(p(-0.32, 0.3, 0.24, 0.7, -0.2, 0.6, 'back'), P(-0.2, 0.15, 0.1, 0.5, -0.2, 0.4)) },
    ],
    maryjane: [
      { at: ['#hero', 'top top'], pose: p(0.29, mob(0.24, 0.35), 0.3, -0.35, 1.9, -0.45) },
      { at: ['#hero', 'top -60%'], pose: p(0.32, mob(0.27, 0.37), 0.32, -0.2, 2.8, -0.3) },
      { at: ['#hero', 'top -150%'], pose: p(0.95, 0.9, 0.32, -1.6, 4.2, -1.4), ease: 'power2.in' },
      { at: ['#about', 'top top'], pose: hidden(0.8, -0.8) },
      // #03: glides right → left across the marquee, big
      { at: ['#ch3', 'top bottom'], pose: p(0.8, -0.8, 0.72, 0.8, 0.4, -0.7) },
      { at: ['#ch3', 'top top'], pose: p(0.26, -0.06, 0.72, 0.3, 1.8, -0.2), ease: 'power3.out' },
      { at: ['#ch3', 'top -100%'], pose: p(-0.24, 0.04, 0.72, 0.1, 3.8, 0.25) },
      ...card(3, 4.0),
      { at: ['#contact', 'top 60%'], pose: hidden(0.8, 0.9) },
      { at: ['#contact', 'top top'], pose: p(0.32, 0.22, 0.26, -0.3, 2.0, -0.4), ease: 'power3.out' },
      { at: ['#contact', 'bottom bottom'], pose: mob(p(0.32, 0.32, 0.21, -0.1, 2.6, -0.3), P(0.2, 0.15, 0.1, -0.1, 2.6, -0.3)) },
    ],
    sandal: [
      { at: ['#hero', 'top top'], pose: p(mob(0.33, 0.5), mob(-0.22, -0.4), 0.32, 0.6, 2.6, 0.3, 'back') },
      { at: ['#hero', 'top -60%'], pose: p(mob(0.36, 0.52), mob(-0.25, -0.42), 0.34, 0.4, 3.4, 0.45, 'back') },
      { at: ['#hero', 'top -150%'], pose: p(1.0, -0.9, 0.34, 1.8, 5.0, 1.4, 'back'), ease: 'power2.in' },
      { at: ['#about', 'top top'], pose: hidden(-0.8, 0.8) },
      // #04: drops from above into the headline, oversized
      { at: ['#ch4', 'top bottom'], pose: p(-0.1, 0.95, 0.8, 1.6, -1.6, 1.0) },
      { at: ['#ch4', 'top top'], pose: p(-0.14, 0.02, 0.8, 0.45, -0.2, 0.3), ease: 'power3.out' },
      { at: ['#ch4', 'bottom bottom'], pose: p(-0.22, -0.02, 0.7, 0.2, 1.0, 0.1) },
      ...card(4, 1.4),
      { at: ['#contact', 'top 60%'], pose: hidden(0.8, -0.9) },
      { at: ['#contact', 'top top'], pose: p(0.34, -0.27, 0.28, 0.6, 2.8, 0.3, 'back'), ease: 'power3.out' },
      { at: ['#contact', 'bottom bottom'], pose: mob(p(0.2, 0.12, 0.2, 0.4, 3.4, 0.4, 'back'), P(0.37, 0.15, 0.09, 0.4, 3.4, 0.4)) },
    ],
    prewalker: [
      { at: ['#hero', 'top top'], pose: p(mob(-0.26, -0.5), mob(-0.27, -0.4), 0.27, 0.25, -1.2, -0.3, mob('front', 'back')) },
      { at: ['#hero', 'top -60%'], pose: p(mob(-0.29, -0.52), mob(-0.3, -0.42), 0.29, 0.1, -0.4, -0.2, mob('front', 'back')) },
      { at: ['#hero', 'top -150%'], pose: p(-1.0, -0.95, 0.29, -1.2, 1.0, -1.6), ease: 'power2.in' },
      { at: ['#about', 'top top'], pose: hidden(-0.8, -0.8) },
      { at: ['#contact', 'top 60%'], pose: hidden(-0.8, -0.9) },
      { at: ['#contact', 'top top'], pose: p(-0.28, -0.29, 0.25, 0.2, -1.0, -0.3), ease: 'power3.out' },
      { at: ['#contact', 'bottom bottom'], pose: mob(p(-0.18, 0.1, 0.19, 0.1, -0.6, -0.2), P(-0.37, 0.15, 0.09, 0.1, -0.6, -0.2)) },
    ],
  }
}
