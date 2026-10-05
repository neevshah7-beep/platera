"""
SCENE 3 · THE STAMP. Macro on a polished bar of sterling silver resting on honey leather
at the assay bench. A hardened steel punch hangs above it. Frames 1–40: the punch draws up,
gathering (the visitor is holding). 41–46: it falls. 46: the strike. 47–72: it rebounds and
lifts away, and BIS · 925 is cut into the silver, read by a low raking light.

The website plays 1–40 while the visitor holds, then 41–72 when they let go.

  blender -b -P src/pipeline/blender/scene_stamp.py -- --still 72 [--samples 64] [--scale 50] [--portrait]
  blender -b -P src/pipeline/blender/scene_stamp.py -- --anim [--samples 160] [--portrait] [--start N]
"""
import math
import os
import sys

import bmesh
import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib  # noqa: E402
from lib import mm  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUT = os.path.join(ROOT, "assets", "render")
FRAMES = 72
HOLD_END = 40
STRIKE = 46
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
portrait = "--portrait" in args


def arg(name, default=None):
    return args[args.index(name) + 1] if name in args else default


def rounded_box(name, sx, sy, sz, bevel, segments=8):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    lib.link(ob)
    mod = ob.modifiers.new("Bevel", "BEVEL")
    mod.width = bevel
    mod.segments = segments
    mod.limit_method = "NONE"
    sub = ob.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 2
    sub.render_levels = 3
    for p in me.polygons:
        p.use_smooth = True
    return ob


def silver_with_mark(strength_frames):
    """Sterling silver, polished, with the hallmark as a bump that appears at the strike.
    The cut floor of the mark is satin (rougher), as a struck mark is."""
    m = bpy.data.materials.new("Sterling")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.97, 0.965, 0.955, 1)
    b.inputs["Metallic"].default_value = 1.0
    b.inputs["Anisotropic"].default_value = 0.4
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    # The mark is 17 mm wide, the size of the die face that cuts it, centred on the bar's top face (object space, metres).
    mp.inputs["Location"].default_value = (0.5, 0.5, 0)
    mp.inputs["Scale"].default_value = (1 / (17 * mm), 1 / (8.5 * mm), 1)
    img = nt.nodes.new("ShaderNodeTexImage")
    img.image = bpy.data.images.load(os.path.join(OUT, "mark.png"))
    img.image.colorspace_settings.name = "Non-Color"
    img.extension = "CLIP"
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul.name = "MarkAmount"
    bump = nt.nodes.new("ShaderNodeBump")
    bump.invert = True
    bump.inputs["Distance"].default_value = 0.00022
    bump.inputs["Strength"].default_value = 1.0
    rough = nt.nodes.new("ShaderNodeMapRange")
    rough.inputs["To Min"].default_value = 0.07
    rough.inputs["To Max"].default_value = 0.32
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], img.inputs["Vector"])
    nt.links.new(img.outputs["Color"], mul.inputs[0])
    nt.links.new(mul.outputs[0], bump.inputs["Height"])
    nt.links.new(mul.outputs[0], rough.inputs["Value"])
    nt.links.new(rough.outputs["Result"], b.inputs["Roughness"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    amount = mul.inputs[1]
    for f, v in strength_frames:
        amount.default_value = v
        amount.keyframe_insert("default_value", frame=f)
    return m


def leather():
    m, b = lib._principled("HoneyLeather", **{"Base Color": (0.42, 0.24, 0.09, 1), "Roughness": 0.55, "Sheen Weight": 0.3})
    nt = m.node_tree
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 900
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.25
    nt.links.new(vor.outputs["Distance"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


def steel():
    """Gunmetal tool steel: darker than the silver so the two metals read apart, with fine
    turning marks, and a diamond knurl on the grip (masked to the middle of the shank)."""
    m, b = lib._principled("ToolSteel", **{"Base Color": (0.36, 0.37, 0.39, 1), "Metallic": 1.0, "Roughness": 0.26, "Anisotropic": 0.6})
    nt = m.node_tree
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    # Knurl: two crossed waves, only between 30 and 55 mm up the shank.
    w1 = nt.nodes.new("ShaderNodeTexWave")
    w1.inputs["Scale"].default_value = 260
    w2 = nt.nodes.new("ShaderNodeTexWave")
    w2.inputs["Scale"].default_value = 260
    w2.bands_direction = "Y"
    mx = nt.nodes.new("ShaderNodeMath")
    mx.operation = "MAXIMUM"
    band = nt.nodes.new("ShaderNodeMapRange")
    band.interpolation_type = "STEPPED"
    band.inputs["From Min"].default_value = 0.03
    band.inputs["From Max"].default_value = 0.055
    band.inputs["Steps"].default_value = 1
    win = nt.nodes.new("ShaderNodeMath")
    win.operation = "MULTIPLY"
    inside = nt.nodes.new("ShaderNodeMath")
    inside.operation = "COMPARE"
    inside.inputs[1].default_value = 0.0425
    inside.inputs[2].default_value = 0.0125
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.5
    bump.inputs["Distance"].default_value = 0.0002
    nt.links.new(tc.outputs["Object"], w1.inputs["Vector"])
    nt.links.new(tc.outputs["Object"], w2.inputs["Vector"])
    nt.links.new(tc.outputs["Object"], sep.inputs["Vector"])
    nt.links.new(w1.outputs["Fac"], mx.inputs[0])
    nt.links.new(w2.outputs["Fac"], mx.inputs[1])
    nt.links.new(sep.outputs["Z"], inside.inputs[0])
    nt.links.new(mx.outputs[0], win.inputs[0])
    nt.links.new(inside.outputs[0], win.inputs[1])
    nt.links.new(win.outputs[0], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


def punch(material):
    """A round tool-steel rod, knurled at the grip, tapering to a small square die face."""
    bm = bmesh.new()
    r, length = 4.6 * mm, 80 * mm
    shank = bmesh.ops.create_cone(bm, cap_ends=True, segments=48, radius1=r, radius2=r, depth=length)
    bmesh.ops.translate(bm, vec=(0, 0, length / 2 + 12 * mm), verts=shank["verts"])
    taper = bmesh.ops.create_cone(bm, cap_ends=True, segments=48, radius1=9.5 * mm, radius2=r, depth=12 * mm)
    bmesh.ops.translate(bm, vec=(0, 0, 6 * mm), verts=taper["verts"])
    me = bpy.data.meshes.new("Punch")
    bm.to_mesh(me)
    bm.free()
    ob = lib.mesh_object("Punch", me, material, smooth=True)
    mod = ob.modifiers.new("Bevel", "BEVEL")
    mod.width = 0.35 * mm
    mod.segments = 4
    mod.harden_normals = True
    return ob


def build():
    scene = lib.reset("Platera_Stamp")
    lib.cycles(scene, samples=int(arg("--samples", 160)), width=900 if portrait else 1600, height=1600 if portrait else 900)
    scene.render.resolution_percentage = int(arg("--scale", 100))
    scene.frame_start, scene.frame_end = 1, FRAMES
    scene.render.fps = 30
    scene.view_settings.exposure = float(arg("--ev", -0.3))
    lib.studio_world(strength=float(arg("--world", 0.5)), rotation=math.radians(float(arg("--rot", 30))))

    pad = rounded_box("Pad", 1.4, 1.0, 0.012, 3 * mm, 6)
    pad.location = (0, 0, -0.006)
    pad.data.materials.append(leather())

    bar = rounded_box("Bar", 62 * mm, 22 * mm, 7 * mm, 1.6 * mm)
    bar.location = (0, 0, 3.5 * mm)
    bar.rotation_euler = (0, 0, math.radians(-8))
    # The mark appears at the moment of the strike.
    bar.data.materials.append(silver_with_mark([(1, 0.0), (STRIKE - 1, 0.0), (STRIKE, 1.0)]))

    tool = punch(steel())
    top = 7 * mm
    # Frames → punch height of its die face above the bar.
    for f in range(1, FRAMES + 1):
        if f <= HOLD_END:
            t = (f - 1) / (HOLD_END - 1)
            z = 9 * mm + 13 * mm * (1 - (1 - t) ** 2)  # drawn up, slowing at the top
        elif f < STRIKE:
            t = (f - HOLD_END) / (STRIKE - HOLD_END)
            z = 22 * mm * (1 - t ** 2.2)  # falling, accelerating
        else:
            s = f - STRIKE
            z = 1.5 * mm * math.exp(-s / 2) * abs(math.sin(s * 0.9)) + max(0.0, s - 4) ** 1.25 * 0.75 * mm  # rebound, then lift away
        tool.location = (0, 0, top + z)
        tool.keyframe_insert("location", frame=f)
    for fc in tool.animation_data.action.fcurves if hasattr(tool.animation_data.action, "fcurves") else []:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

    # Camera: low macro across the bar, the mark in the lower third, the punch above.
    focus = bpy.data.objects.new("Focus", None)
    lib.link(focus)
    focus.location = (0, 0, top)
    if portrait:
        lib.camera("Camera", (0.05, -0.2, 0.125), (0, 0, top + 10 * mm), lens=115, fstop=6.3, focus=focus)
    else:
        lib.camera("Camera", (0.05, -0.2, 0.12), (0, 0, top + 11 * mm), lens=100, fstop=7.1, focus=focus)

    # Light: a low raking key from the side (it is what makes a struck mark legible), a soft
    # overhead box, a warm rim behind, and the diamond-photography cards for the polish.
    lib.area_light("Rake", (-0.26, 0.02, 0.05), (0, 0, top), 0.12, float(arg("--key", 5)), color=(1.0, 0.86, 0.66))
    lib.area_light("Top", (0.05, -0.08, 0.35), (0, 0, top), 0.4, float(arg("--top", 2.5)), color=(1.0, 0.95, 0.88))
    lib.area_light("Rim", (0.12, 0.3, 0.14), (0, 0, top), 0.2, 2.2, color=(1.0, 0.78, 0.48))
    lib.softbox_card("Strip", (0.18, -0.1, 0.12), (0, 0, top), 0.02, 0.2, 2.5, color=(1, 0.97, 0.92))
    # The spark of the strike: a tiny hot light at the die face for two frames.
    spark = lib.area_light("Spark", (0, -0.004, top + 0.6 * mm), (0, 0, top), 0.003, 0, color=(1.0, 0.8, 0.45))
    for f, e in ((STRIKE - 1, 0), (STRIKE, 6), (STRIKE + 2, 1.5), (STRIKE + 4, 0)):
        spark.data.energy = e
        spark.data.keyframe_insert("energy", frame=f)
    return scene


if __name__ == "__main__":
    scene = build()
    os.makedirs(OUT, exist_ok=True)
    if "--still" in args:
        f = int(arg("--still"))
        scene.frame_set(f)
        scene.render.filepath = os.path.join(OUT, f"stamp{'_portrait' if portrait else ''}_still_{f:04d}.png")
        bpy.ops.render.render(write_still=True)
    elif "--anim" in args:
        d = os.path.join(OUT, "stamp_portrait" if portrait else "stamp")
        os.makedirs(d, exist_ok=True)
        scene.render.filepath = os.path.join(d, "")
        if "--start" in args:
            scene.frame_start = int(arg("--start"))
        bpy.ops.render.render(animation=True)
