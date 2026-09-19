import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF } from '@react-three/drei'
import { easing } from 'maath'
import * as THREE from 'three'
import { gsap } from '../gsap'
import { LITE, SHOES, intro, motion, pointer, poses } from '../choreo/shoes'

const DRACO = `${import.meta.env.BASE_URL}draco/`
const CAM_Z = 10
const FOV = 30
const VIEW_H = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAM_Z // world height visible at z = 0

SHOES.forEach((s) => useGLTF.preload(s.url, DRACO))

/**
 * Keep the GLB's own PBR maps; add a whisper of clearcoat for burnished leather.
 * Phones skip the clearcoat pass (standard material, same maps).
 */
function dress(root) {
  root.traverse((o) => {
    if (!o.isMesh) return
    const src = o.material
    const Material = LITE ? THREE.MeshStandardMaterial : THREE.MeshPhysicalMaterial
    const m = new Material({
      map: src.map ?? null,
      color: src.color,
      roughness: src.roughness,
      roughnessMap: src.roughnessMap ?? null,
      metalness: src.metalness,
      metalnessMap: src.metalnessMap ?? null,
      aoMap: src.aoMap ?? null,
      normalMap: src.normalMap ?? null,
      normalScale: src.normalScale?.clone(),
      envMapIntensity: 1.1,
      ...(LITE ? {} : { clearcoat: 0.15, clearcoatRoughness: 0.6 }),
    })
    o.material = m
    src.dispose()
  })
}

/**
 * One shoe. Reads its viewport-relative pose (choreography) + intro offset +
 * idle float + pointer tilt, converts to world space, and damps toward it.
 * Rendered in both canvases; each canvas only shows it when the layer matches.
 */
function ShoeActor({ shoe, layer, index, idle }) {
  const { scene } = useGLTF(shoe.url, DRACO)
  const group = useRef()
  const size = useThree((s) => s.size)

  const { model, offset, unit } = useMemo(() => {
    const model = scene.clone(true)
    model.rotation.set(...shoe.rotation)
    model.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(model)
    const dims = box.getSize(new THREE.Vector3())
    return { model, offset: box.getCenter(new THREE.Vector3()).negate(), unit: 1 / Math.max(dims.x, dims.y, dims.z) }
  }, [scene, shoe.rotation])

  useLayoutEffect(() => dress(model), [model])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const p = poses[shoe.id]
    const o = intro[shoe.id]
    const t = state.clock.elapsedTime + index * 1.7
    const dt = Math.min(delta, 1 / 20)
    const viewW = VIEW_H * (size.width / size.height)

    const float = idle ? Math.sin(t * 0.9) * 0.012 : 0
    // momentum: heavier shoes (bigger on screen) swing more when you scroll fast
    const swing = motion.vel * (0.35 + p.size * 0.5) * (index % 2 ? -1 : 1)
    const tx = p.x * viewW + pointer.x * 0.06 * (index % 2 ? -1 : 1)
    const ty = (p.y + o.dy + float) * VIEW_H + pointer.y * 0.04
    const s = Math.max(0.0001, p.size * VIEW_H)

    easing.damp3(g.position, [tx, ty, 0], 0.18, dt)
    easing.damp3(g.scale, [s, s, s], 0.2, dt)
    easing.dampE(
      g.rotation,
      [
        p.rotX + o.rx + (idle ? Math.sin(t * 0.7) * 0.05 : 0) + pointer.y * 0.12 + motion.vel * 0.45,
        p.rotY + o.ry + (idle ? Math.sin(t * 0.5) * 0.08 : 0) + pointer.x * 0.2,
        p.rotZ + o.rz + (idle ? Math.cos(t * 0.6) * 0.04 : 0) + swing,
      ],
      0.22,
      dt,
    )
    g.visible = p.layer === layer && g.scale.x > 0.002
  })

  return (
    <group ref={group} scale={0.0001}>
      <group scale={unit}>
        <primitive object={model} position={offset} />
      </group>
    </group>
  )
}

function Studio() {
  return (
    <Environment resolution={LITE ? 128 : 256} frames={1}>
      <Lightformer form="rect" intensity={3} color="#ffffff" position={[0, 6, 3]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
      <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[5, 3, 1]} />
      <Lightformer form="rect" intensity={1.2} color="#f2f2f4" position={[6, 0, 2]} rotation-y={-Math.PI / 2} scale={[5, 3, 1]} />
      <Lightformer form="ring" intensity={1.2} color="#ffffff" position={[0, 2, -6]} scale={3} />
      <Lightformer form="rect" intensity={0.6} color="#dcdce0" position={[0, -4, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
    </Environment>
  )
}

/**
 * On-demand rendering: a canvas only draws while one of its shoes is on its
 * layer (plus a short tail so damping settles and hidden shoes clear). The
 * idle canvas — usually one of the two — costs nothing.
 */
function Driver({ layer }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    let tail = 0
    const tick = () => {
      if (SHOES.some((s) => poses[s.id].layer === layer && poses[s.id].size > 0.001)) tail = 45
      if (tail > 0) {
        tail--
        invalidate()
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [invalidate, layer])
  return null
}

function Layer({ layer, idle }) {
  return (
    <div className={`stage stage--${layer}`} aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={[1, LITE ? 1.5 : 1.75]}
        camera={{ position: [0, 0, CAM_Z], fov: FOV, near: 1, far: 40 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: LITE ? 'default' : 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        {/* high-contrast studio: strong key, low fill, bright rim for silhouette */}
        <ambientLight intensity={0.18} />
        <directionalLight position={[5, 7, 6]} intensity={2.4} />
        <directionalLight position={[-6, 1, 4]} intensity={0.35} />
        <directionalLight position={[-3, 4, -6]} intensity={2.2} />
        <Driver layer={layer} />
        <Suspense fallback={null}>
          <Studio />
          {SHOES.map((s, i) => (
            <ShoeActor key={s.id} shoe={s} layer={layer} index={i} idle={idle} />
          ))}
        </Suspense>
      </Canvas>
    </div>
  )
}

/**
 * Two transparent canvases sandwich the page type — shoes can pass behind a
 * headline and in front of the next one, like the reference.
 */
export function Stage({ reduced }) {
  return (
    <>
      <Layer layer="back" idle={!reduced} />
      <Layer layer="front" idle={!reduced} />
    </>
  )
}
