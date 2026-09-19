/**
 * Procedural kids' leather boot → public/models/boot-procedural.glb (Draco-compressed).
 * Fallback stand-in; the live model is the Higgsfield one (scripts/optimize-model.mjs).
 *
 *   npm run build:model
 *
 * This is a stand-in until a scanned / modelled GLB is available. Drop a real
 * model at the same path and the site picks it up unchanged. Mesh + material
 * names ("Leather_*", "Lining", "Outsole", …) are what ShoeModel keys off.
 *
 * Units: boot is ~1.6 long (Z, toe at +Z), ~1.2 tall (Y), centred on X.
 */
import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { Document, NodeIO } from '@gltf-transform/core'
import { KHRDracoMeshCompression } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../assets-src/legacy-v1/public/boot-procedural.glb')

// ─── Shape language ──────────────────────────────────────────────────────────
const L = 1.6 // foot length
const Z0 = -L / 2 // heel end
const YB = 0.15 // top of welt / base of upper
const Y_TOP = 1.1 // collar height

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const zOf = (s) => Z0 + L * s // s: 0 heel → 1 toe
const sOf = (z) => (z - Z0) / L

/** Superellipse envelope: 1 mid-foot, 0 at heel / toe tips. */
const env = (s) => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * s - 1), 3.2)), 1 / 3.2)
/** Half-width of the footprint; kids' lasts are wide and round at the toe. */
const halfWidth = (s) => (0.25 + 0.06 * smooth(0.3, 0.85, s)) * env(s)
/** Height of the foot "dome" above the welt: tall at the ankle, low toe box. */
const domeHeight = (s) => (0.2 + 0.36 * (1 - smooth(0.25, 1, s))) * Math.sqrt(env(s))

function domePoint(s, th, out = new THREE.Vector3()) {
  const w = halfWidth(s)
  const sin = Math.max(0, Math.sin(th))
  return out.set(w * Math.cos(th) * (1 + 0.06 * sin), YB + domeHeight(s) * Math.pow(sin, 0.55), zOf(s))
}

// Shaft (ankle tube): elliptical, narrows at the ankle, flares at the collar, leans back.
const shaftT = (y) => (y - YB) / (Y_TOP - YB)
const shaftRx = (t) => 0.255 - 0.04 * smooth(0.25, 0.65, t) + 0.03 * smooth(0.7, 1, t)
const shaftRz = (t) => 0.34 - 0.05 * smooth(0.25, 0.65, t) + 0.03 * smooth(0.7, 1, t)
const shaftZc = (t) => zOf(0.24) - 0.07 * t

/** phi = 0 faces the toe (+Z), phi = π faces the heel. */
function shaftPoint(y, phi, scale = 1, out = new THREE.Vector3()) {
  const t = shaftT(y)
  return out.set(shaftRx(t) * scale * Math.sin(phi), y, shaftZc(t) + shaftRz(t) * scale * Math.cos(phi))
}

// Numerical surface normal for any (a, b) → point function.
function surfaceNormal(fn, a, b, outward) {
  const e = 1e-3
  const p = fn(a, b)
  const da = fn(a + e, b).sub(fn(a - e, b))
  const db = fn(a, b + e).sub(fn(a, b - e))
  const n = new THREE.Vector3().crossVectors(da, db).normalize()
  if (n.dot(new THREE.Vector3().subVectors(p, outward(p))) < 0) n.negate()
  return n
}
const domeAxis = (p) => new THREE.Vector3(0, YB, p.z)
const shaftAxis = (p) => new THREE.Vector3(0, p.y, shaftZc(shaftT(p.y)))

// ─── Geometry helpers ────────────────────────────────────────────────────────
/**
 * Grid surface from fn(u, v). `axis(p)` gives the point the surface should face
 * away from; winding is flipped automatically (pass inward=true for linings).
 */
function loft(fn, nu, nv, { axis, inward = false } = {}) {
  const pos = []
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const p = fn(i / nu, j / nv)
      pos.push(p.x, p.y, p.z)
    }
  }
  const idx = []
  const row = nu + 1
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * row + i
      const b = a + 1
      const c = a + row
      const d = c + 1
      idx.push(a, b, d, a, d, c)
    }
  }
  let g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g = mergeVertices(g, 1e-5)
  g.computeVertexNormals()

  if (axis) {
    const P = g.attributes.position
    const N = g.attributes.normal
    let vote = 0
    const p = new THREE.Vector3()
    const n = new THREE.Vector3()
    for (let k = 0; k < P.count; k++) {
      p.fromBufferAttribute(P, k)
      n.fromBufferAttribute(N, k)
      vote += Math.sign(n.dot(p.clone().sub(axis(p))))
    }
    if (vote < 0 !== inward) {
      const I = g.index.array
      for (let k = 0; k < I.length; k += 3) [I[k + 1], I[k + 2]] = [I[k + 2], I[k + 1]]
      g.computeVertexNormals()
    }
  }
  return g
}

const tmp = new THREE.Object3D()
/** Small box oriented along `tangent`, sitting on a surface with `normal`. */
function stitch(p, tangent, normal, len = 0.022, w = 0.007, h = 0.005) {
  const g = new THREE.BoxGeometry(len, h, w)
  tmp.position.copy(p).addScaledVector(normal, 0.004)
  const m = new THREE.Matrix4().makeBasis(
    tangent.clone().normalize(),
    normal.clone().normalize(),
    new THREE.Vector3().crossVectors(tangent, normal).normalize(),
  )
  m.setPosition(tmp.position)
  g.applyMatrix4(m)
  return g
}

function footprintShape(scale) {
  const pts = []
  const N = 90
  for (let i = 0; i <= N; i++) {
    const s = i / N
    pts.push(new THREE.Vector2(halfWidth(s) * scale, -zOf(s)))
  }
  for (let i = N - 1; i > 0; i--) {
    const s = i / N
    pts.push(new THREE.Vector2(-halfWidth(s) * scale, -zOf(s)))
  }
  return pts
}

// ─── Parts, bucketed by material ─────────────────────────────────────────────
const buckets = {}
const add = (mat, geo) => (buckets[mat] ||= []).push(geo)

// Outsole: chunky rubber cup sole, bevelled.
{
  const shape = new THREE.Shape(footprintShape(1.08))
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: 0.085,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.014,
    bevelSegments: 4,
  })
  g.rotateX(-Math.PI / 2) // shape y → -z (we stored -z), extrusion → +y
  g.translate(0, 0.02, 0)
  add('Outsole', g)

  // Tread lugs under the forefoot and heel.
  for (let s = 0.08; s < 0.95; s += 0.075) {
    if (s > 0.36 && s < 0.5) continue // waist
    const lug = new THREE.BoxGeometry(halfWidth(s) * 1.5, 0.018, 0.035)
    lug.translate(0, 0.001, zOf(s))
    add('Outsole', lug)
  }
}

// Welt: stitched leather ledge where the upper meets the sole.
{
  const shape = new THREE.Shape(footprintShape(1.045))
  shape.holes.push(new THREE.Path(footprintShape(0.9)))
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2,
  })
  g.rotateX(-Math.PI / 2)
  g.translate(0, YB - 0.036, 0)
  add('Welt', g)

  // Welt stitches running around the ledge.
  const N = 150
  const up = new THREE.Vector3(0, 1, 0)
  for (const side of [1, -1]) {
    for (let i = 1; i < N; i++) {
      const s = i / N
      const p = new THREE.Vector3(side * halfWidth(s) * 0.985, YB + 0.0, zOf(s))
      const q = new THREE.Vector3(side * halfWidth(s + 1e-3) * 0.985, YB, zOf(s + 1e-3))
      if (i % 2) add('Thread', stitch(p, q.sub(p), up, 0.016, 0.006, 0.004))
    }
  }
}

// Upper: foot dome (vamp + toe box).
add(
  'Leather_Upper',
  loft((u, v) => domePoint(u, v * Math.PI), 120, 48, { axis: domeAxis }),
)

// Upper: ankle shaft (outer leather).
add(
  'Leather_Upper',
  loft((u, v) => shaftPoint(YB + v * (Y_TOP - YB), u * Math.PI * 2), 72, 40, { axis: shaftAxis }),
)

// Lining + footbed (peach, visible from the top-down beat).
const Y_BED = 0.72
add(
  'Lining',
  loft((u, v) => shaftPoint(Y_BED + v * (Y_TOP - Y_BED), u * Math.PI * 2, 0.92), 72, 16, {
    axis: shaftAxis,
    inward: true,
  }),
)
{
  const t = shaftT(Y_BED)
  const bed = new THREE.CircleGeometry(1, 48)
  bed.rotateX(-Math.PI / 2)
  bed.scale(shaftRx(t) * 0.93, 1, shaftRz(t) * 0.93)
  bed.translate(0, Y_BED, shaftZc(t))
  add('Footbed', bed)
}

// Padded collar roll (terracotta suede).
{
  const pts = []
  for (let i = 0; i < 64; i++) pts.push(shaftPoint(Y_TOP, (i / 64) * Math.PI * 2, 0.96))
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, 0.045, 14, true)
  g.scale(1, 0.8, 1)
  g.translate(0, Y_TOP * 0.2, 0) // re-centre after the y squash
  add('Suede_Collar', g)
}

// Heel counter: overlay panel wrapping the back of the shaft.
{
  const phiA = 0.3 * Math.PI
  const phiB = 1.7 * Math.PI
  const top = (phi) => YB + 0.1 + 0.24 * clamp01((-Math.cos(phi) + 0.588) / 1.588)
  const fn = (u, v) => {
    const phi = phiA + u * (phiB - phiA)
    return shaftPoint(YB - 0.005 + v * (top(phi) - YB + 0.005), phi, 1.014)
  }
  add('Leather_Overlay', loft(fn, 64, 8, { axis: shaftAxis }))
  for (let i = 1; i < 64; i += 2) {
    const u = i / 64
    const phi = phiA + u * (phiB - phiA)
    const p = shaftPoint(top(phi) - 0.02, phi, 1.02)
    const q = shaftPoint(top(phi + 0.02) - 0.02, phi + 0.02, 1.02)
    const n = surfaceNormal((a, b) => shaftPoint(a, b, 1.02), p.y, phi, shaftAxis)
    add('Thread', stitch(p, q.sub(p), n))
  }
}

// Mudguard / toe cap: wraps from the heel counter to a tall rounded toe bumper.
{
  const cap = (s) => 0.1 + 0.26 * smooth(0.72, 1, s)
  const thetaCap = (s) => {
    const h = domeHeight(s)
    if (h < 1e-4) return Math.PI / 2
    return Math.asin(Math.pow(clamp01(cap(s) / h), 1 / 0.55))
  }
  const S0 = 0.36
  const bumped = (s, th) => {
    const p = domePoint(s, th)
    p.x *= 1.014
    p.y = YB + (p.y - YB) * 1.02
    return p
  }
  for (const side of [0, 1]) {
    const fn = (u, v) => {
      const s = S0 + u * (1 - S0)
      const tc = thetaCap(s)
      const th = side === 0 ? v * tc : Math.PI - v * tc
      return bumped(s, th)
    }
    add('Leather_Overlay', loft(fn, 90, 10, { axis: domeAxis }))

    for (let i = 2; i < 90; i += 2) {
      const s = S0 + (i / 90) * (1 - S0)
      const tc = thetaCap(s) * 0.86
      const th = side === 0 ? tc : Math.PI - tc
      const p = bumped(s, th)
      const s2 = s + 2e-3
      const tc2 = thetaCap(s2) * 0.86
      const q = bumped(s2, side === 0 ? tc2 : Math.PI - tc2)
      const n = surfaceNormal(bumped, s, th, domeAxis)
      add('Thread', stitch(p, q.sub(p), n))
    }
  }
}

// Tongue: rounded panel rising out of the lacing, sitting above the collar.
{
  const half = 0.2
  const fn = (u, v) => {
    const phi = (u * 2 - 1) * half
    const yTop = Y_TOP + 0.07 - 0.06 * Math.pow(phi / half, 2)
    const y = 0.5 + v * (yTop - 0.5)
    return shaftPoint(y, phi, 1.03)
  }
  add('Leather_Overlay', loft(fn, 16, 30, { axis: shaftAxis }))
}

// Eyelets + laces. Rows run bottom (instep) → top (collar).
{
  const rows = []
  const EX = 0.078
  for (const s of [0.64, 0.555]) {
    const pair = [1, -1].map((side) => {
      const th = Math.acos((side * EX) / (halfWidth(s) * 1.04))
      const p = domePoint(s, th)
      const n = surfaceNormal(domePoint, s, th, domeAxis)
      return { p: p.addScaledVector(n, 0.012), n }
    })
    rows.push(pair)
  }
  for (const y of [0.74, 0.88, 1.02]) {
    const pair = [1, -1].map((side) => {
      const t = shaftT(y)
      const phi = Math.asin((side * EX) / (shaftRx(t) * 1.03))
      const p = shaftPoint(y, phi, 1.03)
      const n = surfaceNormal((a, b) => shaftPoint(a, b, 1.03), y, phi, shaftAxis)
      return { p: p.addScaledVector(n, 0.012), n }
    })
    rows.push(pair)
  }

  for (const pair of rows) {
    for (const { p, n } of pair) {
      const g = new THREE.TorusGeometry(0.017, 0.0055, 8, 20)
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n)
      g.applyQuaternion(q)
      g.translate(p.x, p.y, p.z)
      add('Metal_Eyelet', g)
    }
  }

  const laceTube = (a, b, lift = 0.028) => {
    const nMid = a.n.clone().add(b.n).normalize()
    const mid = a.p.clone().lerp(b.p, 0.5).addScaledVector(nMid, lift)
    const curve = new THREE.CatmullRomCurve3([a.p, mid, b.p])
    add('Laces', new THREE.TubeGeometry(curve, 24, 0.011, 8, false))
  }
  laceTube(rows[0][0], rows[0][1], 0.012) // bottom bar
  for (let r = 0; r < rows.length - 1; r++) {
    laceTube(rows[r][0], rows[r + 1][1])
    laceTube(rows[r][1], rows[r + 1][0], 0.036)
  }
  // Bow loops at the top.
  const top = rows[rows.length - 1]
  const centre = top[0].p.clone().lerp(top[1].p, 0.5).addScaledVector(top[0].n.clone().add(top[1].n).normalize(), 0.04)
  for (const side of [1, -1]) {
    const loop = new THREE.CatmullRomCurve3([
      centre,
      centre.clone().add(new THREE.Vector3(side * 0.09, 0.06, 0.07)),
      centre.clone().add(new THREE.Vector3(side * 0.13, -0.03, 0.09)),
      centre.clone().add(new THREE.Vector3(side * 0.03, -0.02, 0.05)),
      centre,
    ])
    add('Laces', new THREE.TubeGeometry(loop, 40, 0.01, 8, false))
    const tail = new THREE.CatmullRomCurve3([
      centre,
      centre.clone().add(new THREE.Vector3(side * 0.04, -0.1, 0.06)),
      centre.clone().add(new THREE.Vector3(side * 0.06, -0.24, 0.07)),
    ])
    add('Laces', new THREE.TubeGeometry(tail, 24, 0.01, 8, false))
  }
  const knot = new THREE.SphereGeometry(0.022, 12, 10)
  knot.translate(centre.x, centre.y, centre.z)
  add('Laces', knot)
}

// Pull tab (brand terracotta) at the back of the collar.
{
  const back = (y, du = 0) => shaftPoint(y, Math.PI + du, 1.04)
  const curve = new THREE.CatmullRomCurve3([
    back(Y_TOP - 0.1),
    back(Y_TOP + 0.05).add(new THREE.Vector3(0, 0, -0.015)),
    back(Y_TOP + 0.1).add(new THREE.Vector3(0, 0, 0.02)),
    back(Y_TOP + 0.04).add(new THREE.Vector3(0, 0, 0.05)),
    back(Y_TOP - 0.05).add(new THREE.Vector3(0, 0, 0.03)),
  ])
  const g = new THREE.TubeGeometry(curve, 30, 0.018, 8, false)
  g.scale(1.9, 1, 1)
  add('Suede_Collar', g)
}

// ─── Global deform: toe spring (toe lifts slightly off the ground) ──────────
function toeSpring(g) {
  const P = g.attributes.position
  for (let i = 0; i < P.count; i++) {
    const s = sOf(P.getZ(i))
    P.setY(i, P.getY(i) + 0.07 * Math.pow(smooth(0.72, 1.05, s), 2))
  }
  P.needsUpdate = true
}

/** Box-projected UVs so the runtime leather-grain map tiles everywhere. */
function boxUV(g, scale = 3) {
  const P = g.attributes.position
  const N = g.attributes.normal
  const uv = new Float32Array(P.count * 2)
  for (let i = 0; i < P.count; i++) {
    const nx = Math.abs(N.getX(i))
    const ny = Math.abs(N.getY(i))
    const nz = Math.abs(N.getZ(i))
    let u
    let v
    if (nx >= ny && nx >= nz) [u, v] = [P.getZ(i), P.getY(i)]
    else if (ny >= nz) [u, v] = [P.getX(i), P.getZ(i)]
    else [u, v] = [P.getX(i), P.getY(i)]
    uv[i * 2] = u * scale
    uv[i * 2 + 1] = v * scale
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
}

// ─── Materials (PBR factors; linear colour) ─────────────────────────────────
const lin = (hex) => {
  const c = new THREE.Color(hex) // THREE.Color stores linear when ColorManagement is on
  return [c.r, c.g, c.b, 1]
}
const MATERIALS = {
  Leather_Upper: { color: '#9C5632', rough: 0.52, double: true }, // cognac, from terracotta
  Leather_Overlay: { color: '#6E3820', rough: 0.46, double: true }, // darker burnished panels
  Welt: { color: '#5A2E1B', rough: 0.55 },
  Outsole: { color: '#141618', rough: 0.82 }, // PDF deep
  Thread: { color: '#F9C5AB', rough: 0.8 }, // PDF peach
  Laces: { color: '#FFF5F2', rough: 0.72 }, // PDF cream
  Lining: { color: '#F9C5AB', rough: 0.92, double: true },
  Footbed: { color: '#E9AE92', rough: 0.9 },
  Suede_Collar: { color: '#CD4F1F', rough: 0.95 }, // PDF terracotta
  Metal_Eyelet: { color: '#C9A27A', rough: 0.32, metal: 1 },
}

// ─── Write glTF ─────────────────────────────────────────────────────────────
const doc = new Document()
const buffer = doc.createBuffer()
const scene = doc.createScene('RovarBoot')
const root = doc.createNode('Boot')
scene.addChild(root)

let tris = 0
for (const [name, geos] of Object.entries(buckets)) {
  const flat = geos.map((g) => {
    g.deleteAttribute('uv')
    const n = g.index ? g.toNonIndexed() : g
    toeSpring(n)
    return n
  })
  let merged = mergeGeometries(flat, false)
  boxUV(merged)
  merged = mergeVertices(merged, 1e-4)
  tris += merged.index.count / 3

  const def = MATERIALS[name]
  const mat = doc
    .createMaterial(name)
    .setBaseColorFactor(lin(def.color))
    .setRoughnessFactor(def.rough)
    .setMetallicFactor(def.metal ?? 0)
    .setDoubleSided(!!def.double)

  const acc = (type, array) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer)
  const prim = doc
    .createPrimitive()
    .setMaterial(mat)
    .setIndices(acc('SCALAR', new Uint32Array(merged.index.array)))
    .setAttribute('POSITION', acc('VEC3', new Float32Array(merged.attributes.position.array)))
    .setAttribute('NORMAL', acc('VEC3', new Float32Array(merged.attributes.normal.array)))
    .setAttribute('TEXCOORD_0', acc('VEC2', new Float32Array(merged.attributes.uv.array)))
  const mesh = doc.createMesh(name).addPrimitive(prim)
  root.addChild(doc.createNode(name).setMesh(mesh))
}

doc
  .createExtension(KHRDracoMeshCompression)
  .setRequired(true)
  .setEncoderOptions({
    method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
    encodeSpeed: 5,
    decodeSpeed: 5,
  })

const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'draco3d.decoder': await draco3d.createDecoderModule(),
})

mkdirSync(dirname(OUT), { recursive: true })
await io.write(OUT, doc)
const { statSync } = await import('node:fs')
console.log(`boot.glb → ${OUT}\n  ${Math.round(tris)} tris, ${(statSync(OUT).size / 1024).toFixed(1)} KB`)
