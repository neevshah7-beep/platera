"""
SCENE 1 — THE FALL. A yellow-gold solitaire falls through warm light in slow motion,
turning, and lands upright in a fold of champagne silk. The silk ripples outward from
the touch, and a key light sweeps across so the diamond throws its fire as it settles.

Rendered as a scroll-scrubbed frame sequence (the homepage scrubs frame = scroll).

  blender -b -P src/pipeline/blender/scene_fall.py -- --still 100 [--samples 64] [--scale 50]
  blender -b -P src/pipeline/blender/scene_fall.py -- --anim [--samples 96]
Frames go to assets/render/fall/####.png; stills to assets/render/fall_still_####.png.
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib  # noqa: E402
from lib import mm  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUT = os.path.join(ROOT, "assets", "render")
FRAMES = 150
LAND = 92
FPS = 30

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
portrait = "--portrait" in args
mask = "--mask" in args  # the ring's matte only (silk as holdout), for layering type behind it


def arg(name, default=None):
    return args[args.index(name) + 1] if name in args else default


def silk(material):
    """Champagne silk: a field of soft folds with a nest where the ring comes to rest."""
    size_x, size_y, res = 0.7, 1.3, 300
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=res, y_segments=int(res * size_y / size_x), size=0.5)
    bmesh.ops.translate(bm, vec=(0, 0.35, 0), verts=bm.verts)  # extend far behind the ring
    bmesh.ops.scale(bm, vec=(size_x, size_y, 1), verts=bm.verts)
    for v in bm.verts:
        x, y = v.co.x, v.co.y
        # Silk folds at real scale (2-4 cm apart): two crossing families of soft ridges,
        # their crests sharpened slightly so they catch the raking light like charmeuse.
        f1 = math.sin(x * 210 + y * 95 + 0.6 * math.sin(y * 60))
        f2 = math.sin(x * 120 - y * 160 + 1.7)
        f3 = math.sin(x * 420 + y * 300 + 2.2)
        h = 2.6 * mm * (abs(f1) ** 0.8 * (1 if f1 > 0 else -0.6)) + 1.6 * mm * f2 + 0.35 * mm * f3
        # The nest: a soft hollow where the ring stands.
        r2 = x * x + (y - 0.004) ** 2
        h -= 1.2 * mm * math.exp(-r2 / (2 * (9 * mm) ** 2))
        # Keep the area right under the ring calm so the band reads whole.
        h *= 1.0 - 0.85 * math.exp(-r2 / (2 * (14 * mm) ** 2))
        # Folds rise toward the back so the frame has depth.
        # Behind the ring the silk sweeps up into a backdrop (a cyclorama), so the top of
        # every frame is soft-focus silk, never sky.
        h += max(0.0, y - 0.05) ** 2 * 1.1
        v.co.z = h
    me = bpy.data.meshes.new("Silk")
    bm.to_mesh(me)
    bm.free()
    ob = lib.mesh_object("Silk", me, material)
    # The ripple from the touch: a Wave modifier that starts at the landing frame.
    wave = ob.modifiers.new("Ripple", "WAVE")
    wave.use_x = True
    wave.use_y = True
    wave.height = 0.35 * mm
    wave.width = 7 * mm
    wave.narrowness = 1.6
    wave.speed = 0.9 * mm
    wave.time_offset = LAND
    wave.damping_time = 40
    wave.falloff_radius = 0.09
    wave.lifetime = 0
    return ob


def build():
    scene = lib.reset("Platera_Fall")
    samples = int(arg("--samples", 96))
    lib.cycles(scene, samples=samples, width=900 if portrait else 1600, height=1600 if portrait else 900)
    scene.render.resolution_percentage = int(arg("--scale", 100))
    scene.frame_start, scene.frame_end = 1, FRAMES
    scene.render.fps = FPS

    gold = lib.gold_18k()
    stone = lib.diamond()
    lib.warm_world(strength=float(arg("--world", 0.1)), top=(1.0, 0.76, 0.42), bottom=(0.25, 0.13, 0.04))
    silk_ob = silk(lib.champagne_silk())
    if mask:
        silk_ob.is_holdout = True
        scene.render.film_transparent = True
        scene.render.image_settings.color_mode = "RGBA"
        scene.cycles.use_denoising = False
    scene.view_settings.exposure = float(arg("--ev", -0.55))

    ring = lib.solitaire(gold, stone)
    rest_z = 9.6 * mm + 0.9 * mm - 0.9 * mm  # sitting in the nest, band fully visible

    # The fall: accelerating like a weight in slow motion, turning one and a quarter
    # times about the vertical, with a small precession so it reads as falling, not a spin.
    for f in range(1, FRAMES + 1):
        if f <= LAND:
            t = (f - 1) / (LAND - 1)
            z = rest_z + 0.075 * (1 - t) ** 2
            spin = math.radians(-450) * (1 - t) ** 1.6
            tilt = math.radians(14) * (1 - t) ** 2 * math.sin(t * 9)
        else:
            s = f - LAND
            # Settle: a damped bounce into the silk, then still.
            z = rest_z - 0.55 * mm * math.exp(-s / 6) * math.cos(s * 0.55)
            spin = math.radians(2.2) * math.exp(-s / 10) * math.sin(s * 0.4)
            tilt = math.radians(1.6) * math.exp(-s / 8) * math.sin(s * 0.7)
        ring.location = (0, 0, z)
        ring.rotation_euler = (tilt, 0, spin + math.radians(-18))
        ring.keyframe_insert("location", frame=f)
        ring.keyframe_insert("rotation_euler", frame=f)

    # Camera: low three-quarter view, 105 mm macro lens, shallow focus on the stone,
    # easing in a few millimetres after the landing.
    focus = bpy.data.objects.new("Focus", None)
    lib.link(focus)
    focus.parent = ring
    focus.location = (0, 0, 9.6 * mm + 3.0 * mm)
    if portrait:
        # Phones: stand back so the ring sits in the upper half and the silk below is calm
        # space for the type; aim below the ring so it rides high in the frame.
        cam = lib.camera("Camera", (0.2, -0.3, 0.085), (0, 0, rest_z - 7 * mm), lens=135, fstop=3.5, focus=focus)
        cam.keyframe_insert("location", frame=1)
        cam.location = (0.19, -0.285, 0.081)
    else:
        cam = lib.camera("Camera", (0.16, -0.24, 0.07), (0, 0, rest_z + 2 * mm), lens=105, fstop=3.2, focus=focus)
        cam.keyframe_insert("location", frame=1)
        cam.location = (0.15, -0.225, 0.066)
    cam.keyframe_insert("location", frame=FRAMES)

    # Light: a big warm key (late sun through a window), a cool-white strip for a long
    # highlight on the gold, a rim from behind, and a small sweep light that crosses the
    # stone after the landing so the facets fire in turn.
    lib.area_light("Key", (-0.42, 0.05, 0.16), (0, 0, 0.004), 0.22, float(arg("--key", 9)), color=(1.0, 0.78, 0.5))  # raking late sun
    lib.area_light("Fill", (0.3, -0.35, 0.3), (0, 0, 0.01), 0.5, float(arg("--fill", 1.2)), color=(1.0, 0.9, 0.75))
    # Contrast for the diamond, as photographers do: black cards and white strips that only
    # the stone's facets see, so it scintillates in crisp black and white instead of going grey.
    black = lib._principled("Card", **{"Base Color": (0.0, 0.0, 0.0, 1), "Roughness": 1.0})[0]
    for i, (x, y, z) in enumerate(((0.05, -0.06, 0.07), (-0.05, -0.07, 0.065), (0.0, 0.06, 0.06))):
        bm = bmesh.new()
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
        bmesh.ops.scale(bm, vec=(0.03, 0.03, 1), verts=bm.verts)
        me = bpy.data.meshes.new(f"Black{i}")
        bm.to_mesh(me)
        bm.free()
        card = lib.mesh_object(f"Black{i}", me, black, smooth=False)
        card.location = (x, y, z)
        lib.aim(card, (0, 0, 0.016))
        card.visible_camera = False
        card.visible_shadow = False
        card.visible_diffuse = False
    for i, (x, y, z) in enumerate(((0.035, -0.07, 0.09), (-0.03, -0.05, 0.1))):
        st = lib.softbox_card(f"White{i}", (x, y, z), (0, 0, 0.016), 0.006, 0.03, 60, color=(1, 1, 1))
        st.visible_diffuse = False
        st.visible_shadow = False
    # A light tent over the stone: eight white panels alternating with gaps, seen only by
    # the facets, so the crown breaks into the crisp black-and-white pattern of a real brilliant.
    for i in range(8):
        a = 2 * math.pi * i / 8
        p = lib.softbox_card(f"Tent{i}", (math.cos(a) * 0.035, math.sin(a) * 0.035, 0.07), (0, 0, 0.016), 0.012, 0.03, float(arg("--tent", 40)), color=(1, 1, 1))
        p.visible_diffuse = False
        p.visible_shadow = False
        p.visible_glossy = True
    # Fire: tiny bright sources the stone's facets catch and split into colour.
    for i, (x, y, z) in enumerate(((-0.06, -0.1, 0.12), (0.07, -0.12, 0.1), (0.0, -0.05, 0.16), (-0.1, 0.02, 0.09))):
        lib.softbox_card(f"Spark{i}", (x, y, z), (0, 0, 0.016), 0.004, 0.004, float(arg("--spark", 4000)), color=(1, 1, 1))
    lib.softbox_card("Strip", (0.22, -0.05, 0.16), (0, 0, 0.012), 0.03, 0.22, float(arg("--strip", 3)), color=(1.0, 0.97, 0.92))
    lib.area_light("Rim", (0.05, 0.35, 0.25), (0, 0, 0.012), 0.2, float(arg("--rim", 3)), color=(1.0, 0.82, 0.55))
    sweep = lib.area_light("Sweep", (-0.18, -0.2, 0.2), (0, 0, 0.016), 0.025, 0, color=(1.0, 0.98, 0.95))
    for f, x, e in ((LAND - 6, -0.18, 0), (LAND + 4, -0.12, 0.6), (FRAMES - 10, 0.16, 0.6), (FRAMES, 0.2, 0.15)):
        sweep.location.x = x
        sweep.data.energy = e
        lib.aim(sweep, (0, 0, 0.016))
        sweep.keyframe_insert("location", frame=f)
        sweep.keyframe_insert("rotation_euler", frame=f)
        sweep.data.keyframe_insert("energy", frame=f)
    return scene


if __name__ == "__main__":
    scene = build()
    os.makedirs(OUT, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "fall.blend"))
    if "--still" in args:
        f = int(arg("--still"))
        scene.frame_set(f)
        scene.render.filepath = os.path.join(OUT, f"fall{'_portrait' if portrait else ''}_still_{f:04d}.png")
        bpy.ops.render.render(write_still=True)
    elif "--anim" in args:
        d = os.path.join(OUT, ("fall_portrait" if portrait else "fall") + ("_mask" if mask else ""))
        os.makedirs(d, exist_ok=True)
        scene.render.filepath = os.path.join(d, "")
        if "--start" in args:  # resume an interrupted sequence
            scene.frame_start = int(arg("--start"))
        bpy.ops.render.render(animation=True)
