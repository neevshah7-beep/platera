import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { velocityFx } from '@tokens/motion'
import common from '../shaders/common.glsl'
import dofFrag from '../shaders/dof.frag.glsl'
import finishFrag from '../shaders/finish.frag.glsl'
import vert from '../shaders/fullscreen.vert.glsl'
import motionFrag from '../shaders/motionblur.frag.glsl'
import ssrFrag from '../shaders/ssr.frag.glsl'
import taaFrag from '../shaders/taa.frag.glsl'
import type { Tier } from '../state'
import { LAYER } from './layers'
import { makeGradeLut } from './lut'

const withCommon = (src: string) => src.replace('#include <common_post>', common)

/** Every pass the bible (§2) asks for, individually switchable (Leva in development). */
export type PassFlags = {
  gtao: boolean
  ssr: boolean
  dof: boolean
  motionBlur: boolean
  bloom: boolean
  chromatic: boolean
  lut: boolean
  vignette: boolean
  grain: boolean
  taa: boolean
}

export const TIER_PASSES: Record<Tier, PassFlags> = {
  3: { gtao: true, ssr: true, dof: true, motionBlur: true, bloom: true, chromatic: true, lut: true, vignette: true, grain: true, taa: true },
  2: { gtao: true, ssr: false, dof: true, motionBlur: false, bloom: true, chromatic: true, lut: true, vignette: true, grain: true, taa: true },
  1: { gtao: false, ssr: false, dof: false, motionBlur: false, bloom: true, chromatic: false, lut: true, vignette: true, grain: true, taa: false },
}

/** Lens state other parts of the world drive (rooms, rig, scroll). */
export const lens = {
  focus: 1.2,
  aperture: 9,
  shimmer: 0,
  shimmerRect: new THREE.Vector4(0, 0, 1, 0.45),
}

function halton(i: number, b: number) {
  let f = 1, r = 0
  while (i > 0) {
    f /= b
    r += f * (i % b)
    i = Math.floor(i / b)
  }
  return r
}
const JITTER = Array.from({ length: 8 }, (_, i) => [halton(i + 1, 2) - 0.5, halton(i + 1, 3) - 0.5] as const)

function shader(frag: string, uniforms: Record<string, THREE.IUniform>) {
  return new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: withCommon(frag), uniforms, depthTest: false, depthWrite: false })
}

/** TAA as a composer pass with its own ping-pong history. */
class TAAPass extends Pass {
  material: THREE.ShaderMaterial
  private quad: FullScreenQuad
  private history: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget]
  private copy: FullScreenQuad
  reset = 1
  constructor(material: THREE.ShaderMaterial, w: number, h: number) {
    super()
    this.material = material
    this.quad = new FullScreenQuad(material)
    const opts = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false }
    this.history = [new THREE.WebGLRenderTarget(w, h, opts), new THREE.WebGLRenderTarget(w, h, opts)]
    this.copy = new FullScreenQuad(new THREE.MeshBasicMaterial({ toneMapped: false }))
  }
  setSize(w: number, h: number) {
    this.history.forEach((t) => t.setSize(w, h))
    this.reset = 1
  }
  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    const [prev, next] = this.history
    this.material.uniforms.tDiffuse.value = readBuffer.texture
    this.material.uniforms.tHistory.value = prev.texture
    this.material.uniforms.uReset.value = this.reset
    renderer.setRenderTarget(next)
    this.quad.render(renderer)
    ;(this.copy.material as THREE.MeshBasicMaterial).map = next.texture
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer)
    this.copy.render(renderer)
    this.history = [next, prev]
    this.reset = 0
  }
  dispose() {
    this.history.forEach((t) => t.dispose())
    this.quad.dispose()
    this.copy.dispose()
  }
}

/**
 * THE RENDER PIPELINE (Experience Bible §2), in the bible's order:
 *   1 render · 2 GTAO · 3 SSR · 4 DOF · 5 motion blur · 6 selective bloom ·
 *   7 chromatic aberration · 8 LUT grade · 9 vignette · 10 grain · 11 TAA
 * TAA resolves before the finishing pass (6–10 are one shader) so the grain is not
 * smeared by the history: the only reordering, and deliberate. Per-frame helper renders:
 * a G-buffer (view normals + depth) shared by GTAO, SSR, DOF, motion blur and TAA; a
 * reflectivity mask for SSR; and the bloom source (only BLOOM-layer objects, everything
 * else black), so bloom never touches the whole frame.
 */
export class Pipeline {
  composer: EffectComposer
  flags: PassFlags
  private gbuffer: THREE.WebGLRenderTarget
  private mask: THREE.WebGLRenderTarget
  private bloomSource: THREE.WebGLRenderTarget
  private normalMat = new THREE.MeshNormalMaterial()
  private black = new THREE.MeshBasicMaterial({ color: 0x000000 })
  private maskVelvet: THREE.ShaderMaterial
  private maskPolish: THREE.ShaderMaterial
  private gtao: GTAOPass
  private ssr: ShaderPass
  private dof: ShaderPass
  private motion: ShaderPass
  private bloom: UnrealBloomPass
  private taa: TAAPass
  private finish: ShaderPass
  private blue: THREE.Texture
  private lut: THREE.Data3DTexture
  private swapped: { mesh: THREE.Mesh; material: THREE.Material | THREE.Material[]; visible: boolean }[] = []
  private prevViewProj = new THREE.Matrix4()
  private viewProj = new THREE.Matrix4()
  private invViewProj = new THREE.Matrix4()
  private jitteredViewProj = new THREE.Matrix4()
  private frame = 0
  private size = new THREE.Vector2()
  private hasPrev = false

  constructor(
    private renderer: THREE.WebGLRenderer,
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
    tier: Tier,
  ) {
    this.flags = { ...TIER_PASSES[tier] }
    renderer.getDrawingBufferSize(this.size)
    const { x: w, y: h } = this.size

    const depthTexture = new THREE.DepthTexture(w, h)
    depthTexture.type = THREE.UnsignedInt248Type
    depthTexture.format = THREE.DepthStencilFormat
    this.gbuffer = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthTexture })
    this.mask = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter })
    this.bloomSource = new THREE.WebGLRenderTarget(Math.ceil(w / 2), Math.ceil(h / 2), { type: THREE.HalfFloatType })

    this.blue = new THREE.TextureLoader().load('/textures/bluenoise128.png')
    this.blue.wrapS = this.blue.wrapT = THREE.RepeatWrapping
    this.blue.minFilter = this.blue.magFilter = THREE.NearestFilter
    this.blue.generateMipmaps = false
    this.lut = makeGradeLut(32)

    const gbufUniforms = () => ({
      tDepth: { value: depthTexture },
      tNormal: { value: this.gbuffer.texture },
      uProjection: { value: new THREE.Matrix4() },
      uProjectionInverse: { value: new THREE.Matrix4() },
      uNear: { value: camera.near },
      uFar: { value: camera.far },
      uResolution: { value: new THREE.Vector2(w, h) },
    })
    const maskMat = (reflectivity: number, roughness: number) =>
      new THREE.ShaderMaterial({
        vertexShader: 'varying float vDepth; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }',
        fragmentShader: `varying float vDepth; void main(){ gl_FragColor = vec4(${reflectivity.toFixed(3)}, ${roughness.toFixed(3)}, vDepth, 1.0); }`,
      })
    this.maskVelvet = maskMat(0.32, 0.85)
    this.maskPolish = maskMat(0.55, 0.12)

    const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType }))
    composer.setPixelRatio(1)
    composer.setSize(w, h)
    composer.addPass(new RenderPass(scene, camera))

    // three r186 GTAOPass reads this.normalRenderTarget inside setGBuffer even when an external
    // G-buffer is given, so it is constructed with its internal buffer and then handed ours.
    this.gtao = new GTAOPass(scene, camera, w, h)
    this.gtao.setGBuffer(depthTexture, this.gbuffer.texture)
    this.gtao.blendIntensity = 1
    this.gtao.updateGtaoMaterial({ radius: 0.12, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: tier === 3 ? 16 : 8, distanceFallOff: 1, screenSpaceRadius: false })
    this.gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 })
    composer.addPass(this.gtao)

    this.ssr = new ShaderPass(shader(ssrFrag, { ...gbufUniforms(), tDiffuse: { value: null }, tMask: { value: this.mask.texture }, tBlue: { value: this.blue }, uFrame: { value: 0 }, uSteps: { value: tier === 3 ? 40 : 24 } }))
    composer.addPass(this.ssr)

    this.dof = new ShaderPass(shader(dofFrag, { ...gbufUniforms(), tDiffuse: { value: null }, uFocus: { value: 1.2 }, uAperture: { value: 9 }, uMaxCoc: { value: 18 }, uTaps: { value: tier === 3 ? 48 : 24 } }))
    composer.addPass(this.dof)

    this.motion = new ShaderPass(shader(motionFrag, { ...gbufUniforms(), tDiffuse: { value: null }, tBlue: { value: this.blue }, uInvViewProj: { value: this.invViewProj }, uPrevViewProj: { value: this.prevViewProj }, uScale: { value: 1 }, uScroll: { value: 0 }, uFrame: { value: 0 } }))
    composer.addPass(this.motion)

    this.taa = new TAAPass(shader(taaFrag, { ...gbufUniforms(), tDiffuse: { value: null }, tHistory: { value: null }, uInvViewProj: { value: this.invViewProj }, uPrevViewProj: { value: this.prevViewProj }, uReset: { value: 1 } }), w, h)
    composer.addPass(this.taa)

    this.bloom = new UnrealBloomPass(new THREE.Vector2(Math.ceil(w / 2), Math.ceil(h / 2)), 0.85, 0.55, 0.9)

    this.finish = new ShaderPass(
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: finishFrag,
        glslVersion: null,
        uniforms: {
          tDiffuse: { value: null },
          tBloom: { value: null },
          tBlue: { value: this.blue },
          tLut: { value: this.lut },
          uLutSize: { value: 32 },
          uBloom: { value: 1 },
          uCA: { value: velocityFx.chromaticMin },
          uLens: { value: 0 },
          uExposure: { value: 1.1 },
          uVignette: { value: 0.25 },
          uGrain: { value: 0.035 },
          uFrame: { value: 0 },
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(w, h) },
          uUseLut: { value: true },
          uUseCA: { value: true },
          uUseVignette: { value: true },
          uUseGrain: { value: true },
          uUseBloom: { value: true },
          uShimmer: { value: 0 },
          uShimmerRect: { value: lens.shimmerRect },
        },
        depthTest: false,
        depthWrite: false,
      }),
    )
    composer.addPass(this.finish)
    this.composer = composer
  }

  setSize(w: number, h: number) {
    this.size.set(w, h)
    this.composer.setSize(w, h)
    this.gbuffer.setSize(w, h)
    this.mask.setSize(w, h)
    this.bloomSource.setSize(Math.ceil(w / 2), Math.ceil(h / 2))
    this.bloom.setSize(Math.ceil(w / 2), Math.ceil(h / 2))
    this.gtao.setSize(w, h)
    this.taa.setSize(w, h)
    for (const p of [this.ssr, this.dof, this.motion, this.finish]) p.uniforms.uResolution?.value.set(w, h)
    this.taa.material.uniforms.uResolution.value.set(w, h)
  }

  setTier(tier: Tier) {
    this.flags = { ...TIER_PASSES[tier] }
  }

  /** Render every frame. `velocity` is scroll velocity (vh/s); `speed` the camera's m/s. */
  render(dt: number, time: number, velocity: number, speed: number, focus: number) {
    const { renderer, scene, camera, flags } = this
    const { x: w, y: h } = this.size
    this.frame++

    // Unjittered matrices (motion blur and TAA reprojection), then jitter for TAA.
    camera.updateMatrixWorld()
    camera.clearViewOffset()
    this.viewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    if (!this.hasPrev) {
      this.prevViewProj.copy(this.viewProj)
      this.hasPrev = true
    }
    if (flags.taa) {
      const [jx, jy] = JITTER[this.frame % 8]
      camera.setViewOffset(w, h, jx, jy, w, h)
    }
    this.jitteredViewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    this.invViewProj.copy(this.jitteredViewProj).invert()

    // Shared uniforms.
    for (const p of [this.ssr, this.dof, this.motion]) {
      p.uniforms.uProjection.value.copy(camera.projectionMatrix)
      p.uniforms.uProjectionInverse.value.copy(camera.projectionMatrixInverse)
      p.uniforms.uNear.value = camera.near
      p.uniforms.uFar.value = camera.far
    }
    const t = this.taa.material.uniforms
    t.uNear.value = camera.near
    t.uFar.value = camera.far

    const needGBuffer = flags.gtao || flags.ssr || flags.dof || flags.motionBlur || flags.taa
    if (needGBuffer) this.renderGBuffer()
    if (flags.ssr) this.renderMask()
    if (flags.bloom) this.renderBloom()

    this.gtao.enabled = flags.gtao
    this.ssr.enabled = flags.ssr
    this.ssr.uniforms.uFrame.value = this.frame
    this.dof.enabled = flags.dof
    this.dof.uniforms.uFocus.value = focus
    this.dof.uniforms.uAperture.value = lens.aperture
    this.motion.enabled = flags.motionBlur
    this.motion.uniforms.uScale.value = Math.min(1.6, 0.35 + speed * 0.25)
    this.motion.uniforms.uScroll.value = velocity
    this.motion.uniforms.uFrame.value = this.frame
    this.taa.enabled = flags.taa

    const f = this.finish.uniforms
    const v = Math.min(1, Math.abs(velocity) / 2.5)
    f.uCA.value = THREE.MathUtils.lerp(velocityFx.chromaticMin, velocityFx.chromaticMax, v)
    f.uLens.value = v * 0.08
    f.uUseCA.value = flags.chromatic
    f.uUseLut.value = flags.lut
    f.uUseVignette.value = flags.vignette
    f.uUseGrain.value = flags.grain
    f.uUseBloom.value = flags.bloom
    f.tBloom.value = this.bloom.renderTargetsHorizontal[0].texture
    f.uFrame.value = this.frame
    f.uTime.value = time
    f.uShimmer.value = lens.shimmer

    this.composer.render(dt)
    camera.clearViewOffset()
    this.prevViewProj.copy(this.viewProj)
  }

  /** View normals + depth for everything opaque; cut-out photos keep their alpha. */
  private renderGBuffer() {
    const { renderer, scene, camera } = this
    this.swapped.length = 0
    scene.traverseVisible((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) {
        if ((o as THREE.Points).isPoints || (o as THREE.Line).isLine || (o as THREE.Sprite).isSprite) {
          this.swapped.push({ mesh: o as unknown as THREE.Mesh, material: (o as THREE.Mesh).material, visible: true })
          o.visible = false
        }
        return
      }
      const excluded = mesh.layers.isEnabled(LAYER.NO_GBUFFER)
      this.swapped.push({ mesh, material: mesh.material, visible: mesh.visible })
      if (excluded) mesh.visible = false
      else mesh.material = (mesh.userData.gbufferMaterial as THREE.Material | undefined) ?? this.normalMat
    })
    const bg = scene.background
    const fog = scene.fog
    scene.background = null
    scene.fog = null
    renderer.setRenderTarget(this.gbuffer)
    renderer.setClearColor(0x7777ff, 1)
    renderer.clear()
    renderer.render(scene, camera)
    scene.background = bg
    scene.fog = fog
    this.restore()
  }

  private renderMask() {
    const { renderer, scene, camera } = this
    const layers = camera.layers.mask
    const bg = scene.background
    scene.background = null
    renderer.setRenderTarget(this.mask)
    renderer.setClearColor(0x000000, 0)
    renderer.clear()
    renderer.autoClear = false
    camera.layers.set(LAYER.SSR_VELVET)
    scene.overrideMaterial = this.maskVelvet
    renderer.render(scene, camera)
    camera.layers.set(LAYER.SSR_POLISH)
    scene.overrideMaterial = this.maskPolish
    renderer.render(scene, camera)
    renderer.autoClear = true
    scene.overrideMaterial = null
    camera.layers.mask = layers
    scene.background = bg
  }

  /** Only BLOOM-layer objects keep their materials; everything else draws black (it still occludes). */
  private renderBloom() {
    const { renderer, scene, camera } = this
    this.swapped.length = 0
    scene.traverseVisible((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh || mesh.layers.isEnabled(LAYER.BLOOM)) return
      this.swapped.push({ mesh, material: mesh.material, visible: mesh.visible })
      mesh.material = this.black
    })
    const bg = scene.background
    const fog = scene.fog
    scene.background = null
    scene.fog = null
    renderer.setRenderTarget(this.bloomSource)
    renderer.setClearColor(0x000000, 1)
    renderer.clear()
    renderer.render(scene, camera)
    scene.background = bg
    scene.fog = fog
    this.restore()
    this.bloom.render(renderer, this.bloomSource, this.bloomSource, 0, false)
  }

  private restore() {
    for (const s of this.swapped) {
      s.mesh.material = s.material
      s.mesh.visible = s.visible
    }
    this.swapped.length = 0
  }

  dispose() {
    this.composer.dispose()
    this.gbuffer.dispose()
    this.mask.dispose()
    this.bloomSource.dispose()
    this.gtao.dispose()
    this.bloom.dispose()
    this.taa.dispose()
    this.lut.dispose()
    this.blue.dispose()
  }
}
