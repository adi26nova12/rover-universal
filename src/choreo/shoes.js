/**
 * The cast. Every shoe is a Higgsfield (Tripo H3.1) GLB, Draco-compressed.
 * `rotation` re-aims each export so its toe points +Z and the sole faces -Y.
 */
/**
 * Phones get a light cast: 1K textures + ~40% triangles (2.5 MB total vs 8 MB),
 * cheaper materials and a lower pixel ratio. Decided once at load.
 */
export const LITE = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)').matches
const BASE = import.meta.env.BASE_URL // '/' locally, '/rover-universal/' on GitHub Pages
const dir = LITE ? `${BASE}models/m` : `${BASE}models`

export const SHOES = [
  { id: 'boot', url: `${dir}/boot.glb`, photo: `${BASE}photos/boot.webp`, rotation: [0, Math.PI, 0], name: 'Classic Boot' },
  { id: 'sneaker', url: `${dir}/sneaker.glb`, photo: `${BASE}photos/sneaker.webp`, rotation: [0, Math.PI, 0], name: 'Everyday Sneaker' },
  { id: 'maryjane', url: `${dir}/maryjane.glb`, photo: `${BASE}photos/maryjane.webp`, rotation: [0, Math.PI, 0], name: 'Mary Jane' },
  { id: 'sandal', url: `${dir}/sandal.glb`, photo: `${BASE}photos/sandal.webp`, rotation: [0, Math.PI, 0], name: 'Closed Sandal' },
  { id: 'prewalker', url: `${dir}/prewalker.glb`, photo: `${BASE}photos/prewalker.webp`, rotation: [0, Math.PI, 0], name: 'Pre-walker' },
]

/**
 * Live pose per shoe, written by the choreography (scroll) and read every
 * frame by the 3D stage. Units are viewport-relative so layout is exact:
 *   x, y  : -0.5‒0.5 of viewport width / height from the centre (y up)
 *   size  : longest side of the shoe as a fraction of viewport height
 *   rot*  : radians
 *   layer : 'back' (behind the type) or 'front' (over the type)
 */
export const poses = Object.fromEntries(
  SHOES.map((s) => [s.id, { x: 0, y: 0, size: 0, rotX: 0, rotY: 0, rotZ: 0, layer: 'front' }]),
)

/** One-off intro offsets (the fall), added on top of the scroll pose. */
export const intro = Object.fromEntries(SHOES.map((s) => [s.id, { dy: 1.4, rx: 0, ry: 0, rz: 0 }]))

/** Smoothed scroll velocity (−1‒1), written by the engine: shoes lean with momentum. */
export const motion = { vel: 0 }

/** Shared pointer for a subtle parallax tilt. */
export const pointer = { x: 0, y: 0 }
