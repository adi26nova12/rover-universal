/**
 * After `vite build`: move the built site to the repo root so GitHub Pages
 * can deploy from main / (root). dist/app.html → index.html, dist/assets → assets/.
 */
import { cpSync, renameSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')

rmSync(resolve(root, 'assets'), { recursive: true, force: true })
cpSync(resolve(dist, 'assets'), resolve(root, 'assets'), { recursive: true })
renameSync(resolve(dist, 'app.html'), resolve(root, 'index.html'))
rmSync(dist, { recursive: true, force: true })
console.log('published → index.html + assets/ (commit and push to deploy)')
