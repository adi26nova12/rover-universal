/**
 * Split the Higgsfield garden-walk clip into a WebP frame sequence for the
 * scroll-scrubbed backdrop:  assets-src/garden-walk.mp4 → public/garden/
 *
 *   npm run extract:garden          (FRAMES=120 WIDTH=1280 to override)
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync, writeFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ffmpeg from 'ffmpeg-static'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, 'assets-src/garden-walk.mp4')
const OUT = resolve(root, 'public/garden')
const FRAMES = Number(process.env.FRAMES ?? 120)
const WIDTH = Number(process.env.WIDTH ?? 1280)

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

// Probe duration from ffmpeg's banner (ffprobe isn't bundled).
let banner = ''
try {
  execFileSync(ffmpeg, ['-i', SRC], { stdio: 'pipe' })
} catch (e) {
  banner = String(e.stderr)
}
const [, h, m, s] = banner.match(/Duration: (\d+):(\d+):([\d.]+)/) ?? []
const duration = h ? +h * 3600 + +m * 60 + +s : 10
const fps = FRAMES / duration

execFileSync(
  ffmpeg,
  ['-y', '-i', SRC, '-vf', `fps=${fps.toFixed(4)},scale=${WIDTH}:-2:flags=lanczos`, '-c:v', 'libwebp', '-quality', '72', '-compression_level', '6', `${OUT}/f_%03d.webp`],
  { stdio: 'inherit' },
)

// ffmpeg numbers from 1; rename to 0-based isn't needed — the manifest says so.
const files = readdirSync(OUT).filter((f) => f.endsWith('.webp')).sort()
const total = files.reduce((n, f) => n + statSync(resolve(OUT, f)).size, 0)
writeFileSync(resolve(OUT, 'frames.json'), JSON.stringify({ count: files.length, pattern: 'f_%03d.webp', start: 1 }))
console.log(`${files.length} frames, ${(total / 1024 / 1024).toFixed(1)} MB → public/garden/`)
