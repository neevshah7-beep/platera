# PLATERA — PROGRESS

Spec: `EXPERIENCE_BIBLE.md`. Protocol: one task, one verification (`/verify/`), one commit.

## Dependency note

The protocol pins three@^0.169, @react-three/fiber@^8.17, @react-three/drei@^9.114 and
@react-three/postprocessing@^2.16. Those are the React 18 generation: fiber 8 does not run on
React 19, which this Next.js 15 app (and its commerce layer) is built on. The same libraries
are installed at their current React 19 majors instead: three 0.186, fiber 9, drei 10, leva 0.10 (0.9 mounts with ReactDOM.render, removed in React 19),
@react-three/postprocessing 3, postprocessing 6.39. Every API the bible needs exists in these
versions (TSL is not used, so no WebGPU dependency). Everything else is installed as listed.

| # | Task | Status | Verified | Notes |
|---|------|--------|----------|-------|
| T1 | World shell | DONE | verify/T1-desktop-*.png, verify/T1-phone-*.png | One canvas mounted in (shop)/layout via WorldProvider; `[world] renderer created` logged exactly once across / → /necklaces → back (desktop and phone, scripts/verify-t1.mjs). URL updates via Next router; Room declarations bind route → room; Director plays the camera move from the live pose so back reverses it (mid-flight x = 5.7 / 19.4 between home x≈0.6 and tray x≈40). Stats overlay (drei Stats) in dev or ?stats: 60 fps. Q1 no (WebGL world). Q2 not yet: rooms are placeholders until T7–T20. Q3 mid-flight crosses empty space: T14 liquid-metal wipe covers non-adjacent moves. Q4 shell only. |
| T2 | Postprocessing chain | NOT_STARTED | | |
| T3 | Material library | NOT_STARTED | | |
| T4 | Lighting rig + choreography | NOT_STARTED | | |
| T5 | Caustics | NOT_STARTED | | |
| T6 | Camera rig | NOT_STARTED | | |
| T7 | Hero piece (Plinth) | NOT_STARTED | | |
| T8 | Threshold entry | NOT_STARTED | | |
| T9 | Asset pipeline | IN_PROGRESS | | Depth (Depth-Anything-V2-small ONNX) + normal + roughness maps generated for all 39 prepared photos (src/pipeline/make-maps.py); 3 flagged low-res. Upscale/denoise step and admin re-shoot queue still to do. |
| T10 | Tray room | NOT_STARTED | | |
| T11 | Push-in transition | NOT_STARTED | | |
| T12 | Lamp room | NOT_STARTED | | |
| T13 | Loupe | NOT_STARTED | | |
| T14 | Liquid metal transitions | NOT_STARTED | | |
| T15 | Motion system + kinetic typography | NOT_STARTED | | |
| T16 | Scroll physics | NOT_STARTED | | |
| T17 | WebGL cursor | NOT_STARTED | | |
| T18 | Ledger | NOT_STARTED | | |
| T19 | Chamber (bridal) | NOT_STARTED | | |
| T20 | Vault | NOT_STARTED | | |
| T21 | Craft film | NOT_STARTED | | |
| T22 | Ambient layer | NOT_STARTED | | |
| T23 | Sound | NOT_STARTED | | |
| T24 | Device tiering | NOT_STARTED | | |
| T25 | Reduced motion | NOT_STARTED | | |
| T26 | Performance pass | NOT_STARTED | | |
| T27 | Commerce re-integration | NOT_STARTED | | |
| T28 | Final audit | NOT_STARTED | | |
