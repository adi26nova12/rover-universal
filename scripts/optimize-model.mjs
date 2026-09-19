/**
 * Optimise a Higgsfield (Tripo H3.1) shoe for the web:
 *   node scripts/optimize-model.mjs [src.glb] [out.glb] [textureSize] [simplifyRatio]
 *   npm run optimize:model            → boot (2048px textures)
 *   npm run optimize:models           → boot + the four supporting shoes
 *   npm run optimize:models:mobile    → phone set (1K textures, ~40% triangles)
 *
 * - textures: 4K JPEG → 2K WebP (colour, ORM, normal)
 * - geometry: weld + Draco (edgebreaker)
 */
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions'
import { dedup, draco, prune, simplify, textureCompress, weld } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'
import { statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const [srcArg, outArg, sizeArg, ratioArg] = process.argv.slice(2)
const SRC = resolve(root, srcArg ?? 'assets-src/boot-higgsfield.glb')
const OUT = resolve(root, outArg ?? 'public/models/boot.glb')
const TEXTURE_SIZE = Number(sizeArg ?? process.env.TEXTURE_SIZE ?? 2048)
const RATIO = Number(ratioArg ?? 1) // < 1 → meshopt simplify (normal map keeps the detail)

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'draco3d.decoder': await draco3d.createDecoderModule(),
})

const doc = await io.read(SRC)

await doc.transform(
  dedup(),
  prune(),
  weld(),
  ...(RATIO < 1 ? [simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: 0.0015 })] : []),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [TEXTURE_SIZE, TEXTURE_SIZE], quality: TEXTURE_SIZE <= 1024 ? 82 : 88 }),
  draco({ method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER, encodeSpeed: 5, decodeSpeed: 5 }),
)

// Friendly names so ShoeModel / future tweaks can key off them.
doc.getRoot().listMaterials().forEach((m) => m.setName('Leather_Shoe'))
doc.getRoot().listMeshes().forEach((m) => m.setName('Shoe'))

await io.write(OUT, doc)
const kb = (p) => (statSync(p).size / 1024).toFixed(0)
console.log(`${OUT.split(/[\\/]/).pop()}: ${kb(SRC)} KB → ${kb(OUT)} KB (${TEXTURE_SIZE}px WebP textures, Draco)`)
