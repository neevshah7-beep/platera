# PLATERA — EXPERIENCE BIBLE (OVERRIDE, SUPERSEDES ALL PRIOR MOTION DIRECTION)

Discard every instruction about phasing, restraint, or minimalism. Keep the
commerce layer already built — pricing engine, admin, cart, checkout, Razorpay,
Shiprocket, data model, SEO. Everything below replaces the presentation layer.

This document is the complete specification for the 3D world and the motion
system. Build all of it.

════════════════════════════════════════
## 0. THE MANDATE

The browser is a render target, not a document viewer. There is no "page" on this
site — there is a continuous three-dimensional space that the customer moves
through, and every surface in it behaves like a real object under real light.

The bar: a senior creative developer from Lusion, Active Theory, Resn, Unseen or
Dogstudio opens this site, opens DevTools, and cannot immediately work out how it
was made.

ANTI-SIMPLICITY CLAUSE — apply before every decision:
  - Ambitious version over safe version. Every time. Without asking.
  - "Restraint", "minimal", "subtle", "clean" and "let it breathe" are not design
    directions on this project.
  - A section that is text on a background is a failure.
  - If a section could have been built with Tailwind alone, rebuild it.
  - Never reduce scope for performance. Optimise instead.
  - Never reduce scope for asset limitations. See §9.
  - Never ship a fallback as the primary experience.

What survives from the earlier brief: the palette, the metal rule (gold is a
material, never a flat fill), the typography, the banned-cliché list (no
glassmorphism, no glow blobs, no sparkle PNGs, no floating abstract spheres), and
all jewellery commerce logic. Luxury here means CINEMATIC AND TECHNICALLY
EXTRAORDINARY, not quiet.

════════════════════════════════════════
## 1. THE WORLD MODEL

One `<canvas>`, one WebGLRenderer, one scene graph, alive for the entire session.
It never unmounts. Routes do not reload — the camera travels between rooms in a
single continuous space.

THE ROOMS, and their spatial relationship:
  THE THRESHOLD   extreme macro of a gold surface. Where the session begins.
  THE PLINTH      the hero piece under studio light. Camera pulls back to here.
  THE TRAY        a velvet surface extending along −Z, pieces laid across it.
  THE LAMP        a single piece on a pad, lit by a lamp the user controls.
  THE LEDGER      the book, presented on the same surface beside the piece.
  THE CHAMBER     bridal. Pieces suspended at depth in volumetric light.
  THE VAULT       a drawer that slides out of the floor of whichever room you are in.

Navigation = camera transition between rooms. Routes update the URL and the camera
target simultaneously. Entering a product from the Tray is one unbroken dolly, not
a page change. Browser back reverses the camera move.

Implement as a `WorldProvider` holding renderer, scene registry, camera rig and a
transition orchestrator. Rooms register and unregister their contents; the canvas
and renderer persist.

════════════════════════════════════════
## 2. RENDER PIPELINE — exact spec

Renderer: WebGL2, antialias off (TAA handles it), powerPreference high-performance,
ACESFilmicToneMapping, exposure 1.1, outputColorSpace SRGB, logarithmicDepthBuffer
off, shadowMap VSM.

POSTPROCESSING CHAIN, in this order, via postprocessing/EffectComposer:
  1. Render pass
  2. GTAO (ground-truth ambient occlusion) — contact darkening in crevices and
     settings. This is what makes metal read as solid.
  3. SSR (screen-space reflections) on the velvet and plinth surfaces only
  4. Depth of field — bokeh, focal plane bound to the hero stone, aperture
     animated on scroll
  5. Motion blur from a velocity buffer, scaled by camera and scroll velocity
  6. Selective bloom — threshold 0.9, applied to specular highlights only via a
     bloom-mask render layer, never to the whole frame
  7. Chromatic aberration — radial, strength 0.0008, rising to 0.004 at high
     scroll velocity
  8. LUT colour grade — a hand-authored 3D LUT pushing shadows cool and highlights
     warm, so gold separates from the ground
  9. Vignette — subtle, 0.25
 10. Film grain — animated, 0.035, with blue-noise sampling not white noise
 11. TAA with jitter, 8-sample Halton sequence

This stack is the difference between "a web page with 3D on it" and "a rendered
image". Do not cut passes to hit frame rate — drop DPR and sample counts first.

════════════════════════════════════════
## 3. MATERIAL SYSTEM

Every material is authored, never a default. Build them as a shared library.

GOLD (champagne)
  MeshPhysicalMaterial: metalness 1, roughness 0.18 base, anisotropy 0.7 with
  tangent direction following the piece's form, clearcoat 0.3, clearcoatRoughness
  0.1. A procedural brushed-microdetail normal map at high tiling. Env map from
  the room's generated HDRI. Roughness varies spatially via a subtle FBM so
  highlights break up the way real polished gold does.

DIAMOND / STONE
  MeshTransmissionMaterial: transmission 1, thickness driven per-geometry, IOR
  2.42, chromaticAberration 0.06, anisotropicBlur 0.1, distortion 0.2, samples 10
  desktop / 4 mobile, backside true, backsideThickness tuned per cut. Dispersion
  implemented as three refraction samples at slightly different IORs for R, G and
  B. This is what makes a stone look like a stone and not like glass.

VELVET (the Tray)
  Custom shader: Lambert base plus a strong Fresnel sheen term with
  view-dependent fibre scatter, a tiled cloth normal map, and anisotropic
  highlights perpendicular to the nap direction. The nap direction shifts subtly
  where a piece rests, as if the fabric has been pressed.

PAPER / LEDGER SURFACE
  Subsurface approximation with a fibre normal map and a soft wrap-lighting term.

LIQUID METAL (transitions)
  Screen-space refraction of the previous frame through a curl-noise-displaced
  surface, with a metallic Fresnel on top and chromatic separation at the wave
  front.

MATCAP FALLBACK
  For the lowest device tier, every material has a matcap variant baked from the
  real one, so low-end devices get the same silhouette and read, at a fraction of
  the cost. Never a flat colour.

════════════════════════════════════════
## 4. LIGHTING SYSTEM

Generated procedurally in-scene, not loaded as a heavy HDR file.

  KEY       rect area light, 4:3, warm 4200K, at 35° camera-left and 20° above.
            This is the light that travels across pieces.
  FILL      rect area light, cool 6000K, camera-right, 25% key intensity.
  RIM       small high-intensity spot behind and above, picking out the silhouette
            edge. On gold this is what produces the expensive edge-glint.
  BOUNCE    a large dim area light below, simulating light returning from the
            surface the piece sits on.
  ENV       generated gradient environment map built at runtime into a cubemap
            render target, refreshed when the room changes.

LIGHT CHOREOGRAPHY — the key light is never static:
  - Hero: travels on a slow elliptical path, 14s period, so facets ignite in
    sequence.
  - Tray: travels with the camera along −Z, so pieces light up as you pass them.
  - Lamp: bound to the user's pointer or drag.
  - Chamber: six individually lit pieces, each with its own key, plus volumetric
    shafts.
  - Everywhere: light intensity modulates ±8% on a slow noise, so nothing is
    perfectly still.

VOLUMETRICS
  Raymarched god-rays in the Chamber — 32 steps, blue-noise dithered, with density
  from a 3D noise field so the shafts have structure. Not sprite flares, not a
  radial-blur hack.

CAUSTICS
  Compute the stone's refraction into a caustic texture in a separate render pass
  and project it onto the surface below the piece. Animate with the light. This is
  the single most expensive-looking detail on the site.

════════════════════════════════════════
## 5. CAMERA SYSTEM

A camera rig with named moves, all spring-driven. No linear tweens anywhere.

  PARALLAX    pointer offsets the camera, damped spring (stiffness 60, damping 18),
              max ±0.4 units. The camera moves, never the object.
  DOLLY       scroll drives Z translation along a CatmullRom path per room.
  ORBIT       scroll drives polar angle in the Plinth room — the turntable.
  PUSH-IN     clicking a piece dollies from Tray to Lamp, 1.6s, custom ease
              [0.65, 0, 0.35, 1], with the focal plane animating in sync.
  RACK FOCUS  DOF focal distance animates independently of camera position when
              attention shifts between a piece and the Ledger.
  HANDHELD    a permanent, almost imperceptible noise on camera rotation
              (amplitude 0.0015 rad, 0.3Hz) so no shot is ever dead-still. This
              one detail does more for "cinematic" than anything else in this list.

════════════════════════════════════════
## 6. THE COMPLETE ANIMATION CATALOGUE

Every technique below is used somewhere on this site. §8 assigns them.

ENTRY & REVEAL
  mask wipes driven by a shader (ink, metal, curl noise) · clip-path reveals on a
  bezier · scale-from-0.94 with spring overshoot · character-level text explosion
  and reassembly · stagger with distance-based delay from the cursor's last
  position · draw-on SVG paths via stroke-dashoffset · morph between SVG paths ·
  3D flip reveals on the X axis · depth-sorted layered parallax entry

SCROLL-LINKED
  ScrollTrigger scrub on camera dolly · pinned sections with internal progress ·
  horizontal scroll inside vertical · scroll-velocity → global uniform feeding
  skew, lens distortion, motion blur and light-trail length · scroll-driven
  turntable rotation · scrub-scrubbed video · snap points at room boundaries with
  spring settle · progress indicator as a filling metal hairline · inertia carry
  so stopping scroll decelerates the world rather than freezing it

HOVER & POINTER
  magnetic attraction within radius with spring return · mesh deformation toward
  the cursor · ink-bleed fill using an animated SDF · cursor-tracked specular
  highlight on metal · tilt on two axes with perspective and spring damping ·
  displacement-on-hover via noise texture · ripple from pointer position
  propagating across a plane · proximity-based scale on neighbours (dock effect)

TEXT
  split to characters and words · 3D rotateX entry per character with stagger ·
  extruded 3D text with the gold material for the largest display moments ·
  variable-font weight animated on scroll · kinetic marquee with velocity skew and
  spring snap-back to zero · number count-up with easing on every price, weight
  and rate · typewriter reveal on the one place it belongs (the Ledger's
  certificate line) · text-mask over moving video

IMAGE
  WebGL displacement transitions between images · RGB-split on velocity, bounded ·
  parallax-occlusion depth from generated depth maps · zoom-on-scroll with
  counter-scaled container so there is no crop jump · the Loupe lens · duotone
  grade on hover resolving to full colour · progressive blur-up from LQIP, blurred
  in the shader not CSS

TRANSITIONS
  liquid-metal mercury wipe with screen-space refraction of the outgoing frame ·
  camera dolly as the transition itself · shared-element flight between routes ·
  directional wipes keyed to navigation depth · never a crossfade, never a white
  flash

PHYSICS
  spring systems on every interactive element (no CSS easing on anything
  interactive) · inertia on drag with friction decay · GPGPU particles in an FBO
  for the dust motes in the Chamber light shafts · soft-body jiggle on the vault
  drawer when it hits its stop · cloth simulation on the velvet when a piece is
  lifted

AMBIENT (always running, never static)
  light intensity noise · camera handheld noise · grain animation · slow env-map
  rotation · dust motes drifting in volumetric light · a faint heat-shimmer
  distortion over the gold surface in the Threshold

CURSOR
  WebGL-rendered molten gold droplet · velocity stretch along the motion vector ·
  surface-tension pooling when still · contextual morph: loupe over product images,
  a ring outline over links, a scale glyph over weights, a crosshair over the
  draggable lamp · trailing metaball tail using an SDF

SOUND (muted by default, with a visible, elegant toggle; never autoplay audible)
  a low room tone per room · a soft metallic tick on magnetic snap · a brushed
  sweep on route transition · a single struck-crystal note when a piece is saved
  to the Vault. Luxury houses do this. Keep it under 300KB total, lazy-loaded
  after first interaction, and respect the user's choice in localStorage.

════════════════════════════════════════
## 7. MOTION CONSTANTS

Publish as tokens. Nothing uses a browser default.

  spring.soft     stiffness 40,  damping 14   — camera, large masses
  spring.default  stiffness 90,  damping 18   — UI, cards, magnetic elements
  spring.snappy   stiffness 180, damping 22   — cursor, small elements
  ease.entry      cubic-bezier(0.16, 1, 0.3, 1)
  ease.exit       cubic-bezier(0.7, 0, 0.84, 0)
  ease.camera     cubic-bezier(0.65, 0, 0.35, 1)
  duration.micro  180ms   duration.ui 420ms   duration.camera 1600ms
  stagger.base    40ms, scaled by distance from the trigger point

PACING: every curve roughly 30% slower than instinct. Luxury moves at a different
speed than SaaS. Weight, not speed, is the feeling.

════════════════════════════════════════
## 8. SECTION BY SECTION — exact stack per room

### THRESHOLD (entry, once per session)
Darkness. A thin light line sweeps across the PLATERA wordmark, letterforms
igniting as it passes — implemented as an SDF mask animated across extruded 3D
text with the gold material. The camera then pulls back from extreme macro of a
displacement-mapped gold surface (reading as abstract terrain) to reveal the hero
piece on it. 2.5s, ease.camera, skippable, heat-shimmer ambient throughout.

### PLINTH (hero)
Hero piece, §3 gold + diamond, §4 full light rig with travelling key and projected
caustics, DOF focal plane on the stone, selective bloom on facets, camera parallax
on spring.soft, handheld noise always on. Scroll converts the parallax into an
ORBIT — the turntable — with three lines of copy arriving one per quarter turn, as
character-level 3D entries. H1 remains DOM text and the LCP element.

### TRAY (collection)
Velvet surface extending along −Z with the §3 velvet shader. Products are depth-
mapped planes with parallax occlusion, at varied scale and position, with real
contact shadows and SSR picking up the velvet. Scroll dollies the camera; the key
light travels with it so pieces ignite in sequence as you pass. Hover: tilt,
cursor-tracked specular, neighbour proximity scale, cloth press under the piece.
Click: PUSH-IN camera move continuously into the Lamp room, with a shared-element
flight so the piece never visually jumps. Filters are a jeweller's index, revealed
with a draw-on hairline and staggered character entry.

### LAMP (product)
The piece on a pad. The user DRAGS the light: pointer position drives a specular
shader over the product image using the generated normal map, so highlights
travel across the metal exactly as they do under a shop lamp. Drag has inertia
and friction decay. Turntable on drag and scroll. Rack focus between the piece
and the Ledger. Scale reference appears with a measured, draw-on dimension line.

### LOUPE (inspection, available anywhere on product imagery)
WebGL lens: genuine barrel distortion, chromatic fringing at the rim, a champagne
bezel rendered as moving PBR metal with its own specular response, and a soft
shadow cast onto the image beneath. Hold to zoom deeper on an eased curve.
Long-press on touch. 120fps, transform and uniform updates only.

### LEDGER
Builds line by line: rows slide in on stagger.base with a hairline drawing beneath
each, every figure counting up on an eased curve, the live gold rate ticking like
a trading terminal. Certificate line reveals with the one typewriter moment on the
site. Transparency presented as a reveal.

### CHAMBER (bridal)
Full-screen 3D. Camera moves through a space where bridal pieces hang suspended at
staggered depths, each individually lit, with raymarched volumetric shafts and
GPGPU dust motes drifting through them. Garnet appears here and nowhere else at
scale. The most cinematic sixty seconds on the site. Ends in the appointment CTA,
not a cart button.

### CRAFT FILM
Scroll-scrubbed macro footage displaced through a shader so it bends over a curved
surface as it scrubs, with grain and grade matching the rest of the site.

### VAULT
The floor of the current room opens and a drawer slides forward in real
perspective with depth, contact shadow and a soft-body jiggle at the stop. Saved
pieces rest inside on velvet. A struck-crystal note on save, if sound is enabled.

### TRANSITIONS between all rooms
Liquid-metal mercury wipe with screen-space refraction of the outgoing frame,
direction keyed to navigation depth, or a direct camera dolly where the rooms are
spatially adjacent.

════════════════════════════════════════
## 9. ASSET REALITY — NOT A REASON TO SIMPLIFY

Photography is WhatsApp-compressed and inconsistent; roughly 11 of 50 files are
high resolution, and there are no turntable sequences. Build everything above
anyway, via this pipeline:

  - At import: upscale and denoise, then generate per-image NORMAL, ROUGHNESS and
    DEPTH maps (Sobel-derived height → normal; depth via a monocular estimate).
    Cache them. These maps are what let a flat photograph behave like a lit object
    under the Lamp and in the Tray.
  - Synthetic turntable: with a single image, drive a ±15° parallax-occlusion
    rotation from the depth map. Reserve the real 36-frame path for when frames
    arrive, behind the same component API.
  - Loupe magnifies the enhanced upscale; tune for optical depth, not pixel zoom.
  - Hero: if no GLB exists, generate the ring parametrically in code — real band
    geometry, a brilliant-cut stone with correct facet angles, real materials. It
    is a hero object, not a SKU. Leave a clean swap point.
  - Flag every product whose source is too low-resolution and surface that list in
    admin as a re-shoot queue.

════════════════════════════════════════
## 10. PERFORMANCE — OPTIMISE, NEVER CUT

Targets hold with all of the above: LCP < 2.5s, 60fps desktop, 30fps floor on a
mid-range Android, CLS < 0.05.

DEVICE TIERING — reduce fidelity, never remove features:
  TIER 3 (desktop GPU)  full postprocessing chain, DPR 2, transmission samples 10,
                        volumetrics 32 steps, GPGPU particles on
  TIER 2 (good mobile)  drop SSR and motion blur, DPR 1.5, samples 4, volumetrics
                        16 steps, particles halved
  TIER 1 (low-end)      matcap materials, no transmission (baked refraction
                        texture), grain + vignette + bloom only, DPR 1,
                        volumetrics off, parallax instead of orbit
Detect via GPU renderer string plus a 60-frame benchmark on load, and allow
promotion upward if the benchmark is strong.

Also: H1 is DOM text and the LCP element, canvas mounts after first paint; render
loop paused off-screen and on hidden tabs; dispose on unmount; zero per-frame
allocations; Draco + KTX2; hard draw-call budget; instancing for repeated geometry;
frustum culling; LOD on the hero model.

prefers-reduced-motion: a genuinely art-directed static version — posed 3D renders,
full grade and grain, no scrub, no autoplay, no handheld. Designed, not stripped.

════════════════════════════════════════
## 11. VERIFY — this is where the previous build failed

After every section: run the dev server, screenshot, and LOOK at it. Then answer,
in BUILD_NOTES:
  1. Could this have been built without WebGL? If yes, rebuild it.
  2. Would a creative developer wonder how it was made? If no, push further.
  3. Is anything on this screen static that could be alive?
  4. Does it feel like a physical object under real light, or like a web page?

If you shipped a simpler version of anything in this document, say so explicitly
and say why. Do not quietly downscope. Do not ask which items to prioritise. Do
not propose a reduced set. If something is genuinely impossible, build the hardest
version that is possible and document the gap.
