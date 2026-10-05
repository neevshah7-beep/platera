'use client'

import * as THREE from 'three'

/**
 * Every material in the gallery, created once and shared. Colours come from the CSS
 * tokens in globals.css (one palette for the HTML and the 3D); the physics (metalness,
 * roughness, index of refraction) come from the real materials they stand for.
 */
function token(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return new THREE.Color(v || fallback)
}

let cache: ReturnType<typeof build> | null = null

function build() {
  const loader = new THREE.TextureLoader()
  const marbleMap = loader.load('/textures/marble_white.jpg')
  marbleMap.colorSpace = THREE.SRGBColorSpace
  marbleMap.wrapS = marbleMap.wrapT = THREE.RepeatWrapping
  marbleMap.anisotropy = 8

  const ground = token('--ground', '#0b0a09')
  const raised = token('--ground-raised', '#eae3d7')

  return {
    colors: {
      ground,
      raised,
      gold: token('--gold', '#a8844f'),
      ink: token('--ink-on-dark', '#1c1b19'),
      lamp: token('--lamp', '#fff8ee'),
      mark: token('--argent-shadow', '#4f5357'),
      specSilver: token('--spec-silver', '#eef2f5'),
      specGold: token('--spec-gold', '#e2c48c'),
      shadowInk: token('--shadow-ink', '#5a5248'),
    },
    /** Polished 925 silver: a near-white metal with a faint brushed anisotropy. */
    silver: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.97, 0.965, 0.96), metalness: 1, roughness: 0.075, anisotropy: 0.35, clearcoat: 0.2, clearcoatRoughness: 0.05, envMapIntensity: 1.5 }),
    /** Antique gold: warmer, a touch rougher. */
    gold: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.86, 0.66, 0.38), metalness: 1, roughness: 0.2, envMapIntensity: 1.3 }),
    /** Brass for the balance: gold's duller cousin. */
    brass: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.78, 0.6, 0.32), metalness: 1, roughness: 0.28, clearcoat: 0.4, clearcoatRoughness: 0.2, envMapIntensity: 1.2 }),
    /** Hardened steel for the hallmark punch. */
    steel: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.55, 0.56, 0.58), metalness: 1, roughness: 0.35, envMapIntensity: 1.1 }),
    /** Small pavé stones: physical glass with a diamond's index; the environment gives the sparkle. */
    pave: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(1, 1, 1), metalness: 0, roughness: 0, ior: 2.4, specularIntensity: 1, envMapIntensity: 3, iridescence: 0.3, iridescenceIOR: 1.8 }),
    /** White Carrara marble with a polished top. */
    marble: new THREE.MeshPhysicalMaterial({ map: marbleMap, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.12, envMapIntensity: 0.8 }),
    marbleMatte: new THREE.MeshStandardMaterial({ map: marbleMap, roughness: 0.6, envMapIntensity: 0.5 }),
    /** Walls of the gallery: warm ivory plaster. */
    plaster: new THREE.MeshStandardMaterial({ color: ground, roughness: 0.95, envMapIntensity: 0.6 }),
    /** Stone-coloured velvet for trays, pads and the neck form. */
    velvet: new THREE.MeshPhysicalMaterial({ color: raised, roughness: 1, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color(1, 1, 1), envMapIntensity: 0.4 }),
    marbleMap,
  }
}

export function useMaterials() {
  if (typeof window === 'undefined') throw new Error('materials are client-only')
  cache ??= build()
  return cache
}
