"""
SCENE 5 · THE GIFT. A Platera box on champagne silk is wrapped, start to finish:
  1–20     the box rests on an open sheet of espresso paper, foiled in gold
  20–45    the side flaps fold up around the box
  45–70    the front and back flaps fold up
  70–100   the top flaps fold over, back then front, the front overlapping
  100–140  champagne satin ribbon draws itself around the box, one way then the other
  140–162  the bow blooms from the knot
  162–200  a cream gift tag drops on its thread and swings to rest

The website scrubs these frames with scroll; dragging the ribbon's tail plays them back.

  blender -b -P src/pipeline/blender/scene_gift.py -- --still 120 [--samples 64] [--scale 50] [--portrait]
  blender -b -P src/pipeline/blender/scene_gift.py -- --anim [--samples 160] [--portrait] [--start N]
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
FRAMES = 200
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
portrait = "--portrait" in args
W, D, H = 70 * mm, 70 * mm, 45 * mm  # the box
T = 0.35 * mm  # paper thickness


def arg(name, default=None):
    return args[args.index(name) + 1] if name in args else default


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def settle(t):
    """Ease out with a slight overshoot: a fold pressed home with a finger."""
    t = max(0.0, min(1.0, t))
    return 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2


def silk_field(material):
    size_x, size_y, res = 1.2, 1.4, 280
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=res, y_segments=int(res * size_y / size_x), size=0.5)
    bmesh.ops.scale(bm, vec=(size_x, size_y, 1), verts=bm.verts)
    bmesh.ops.translate(bm, vec=(0, 0.3, 0), verts=bm.verts)
    for v in bm.verts:
        x, y = v.co.x, v.co.y
        f1 = math.sin(x * 70 + y * 32 + 0.6 * math.sin(y * 20))
        f2 = math.sin(x * 40 - y * 52 + 1.7)
        h = 6 * mm * (abs(f1) ** 0.8 * (1 if f1 > 0 else -0.6)) + 3.5 * mm * f2
        r2 = x * x + y * y
        h *= 1.0 - 0.92 * math.exp(-r2 / (2 * 0.09 ** 2))  # calm where the box stands
        h += max(0.0, y - 0.12) ** 2 * 0.8
        v.co.z = h - 4 * mm
    me = bpy.data.meshes.new("Silk")
    bm.to_mesh(me)
    bm.free()
    return lib.mesh_object("Silk", me, material)


def box_shell(name, sx, sy, sz, material, bevel=1.2 * mm):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = lib.mesh_object(name, me, material, smooth=False)
    m = ob.modifiers.new("Bevel", "BEVEL")
    m.width = bevel
    m.segments = 4
    m.harden_normals = True
    return ob


def paper_material():
    m = bpy.data.materials.new("FoilPaper")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (9, 9, 9)
    col = nt.nodes.new("ShaderNodeTexImage")
    col.image = bpy.data.images.load(os.path.join(OUT, "paper.png"))
    foil = nt.nodes.new("ShaderNodeTexImage")
    foil.image = bpy.data.images.load(os.path.join(OUT, "paper_foil.png"))
    foil.image.colorspace_settings.name = "Non-Color"
    for img in (col, foil):
        img.projection = "BOX"
        img.projection_blend = 0.2
    rough = nt.nodes.new("ShaderNodeMapRange")
    rough.inputs["To Min"].default_value = 0.62
    rough.inputs["To Max"].default_value = 0.22
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], col.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], foil.inputs["Vector"])
    nt.links.new(col.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(foil.outputs["Color"], b.inputs["Metallic"])
    nt.links.new(foil.outputs["Color"], rough.inputs["Value"])
    nt.links.new(rough.outputs["Result"], b.inputs["Roughness"])
    b.inputs["Sheen Weight"].default_value = 0.2
    return m


def satin():
    m, b = lib._principled("GoldSatin", **{"Base Color": (0.62, 0.36, 0.08, 1), "Roughness": 0.3, "Anisotropic": 0.85, "Metallic": 0.75, "Sheen Weight": 1.0, "Sheen Tint": (1, 0.88, 0.62, 1), "Specular IOR Level": 0.8})
    return m


def flap(name, size, material):
    """A paper flap as a thin slab, its hinge edge at the local origin, extending +Y."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(size[0], size[1], T), verts=bm.verts)
    # The thickness lies on the flap's -Z side: outward once the flap is folded up against
    # the box, so the paper wraps the box rather than sinking into its walls.
    bmesh.ops.translate(bm, vec=(0, size[1] / 2, -T / 2), verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return lib.mesh_object(name, me, material, smooth=False)


def pivot(name, parent=None, location=(0, 0, 0), rotation=(0, 0, 0)):
    e = bpy.data.objects.new(name, None)
    lib.link(e)
    e.parent = parent
    e.location = location
    e.rotation_euler = rotation
    return e


def key_rot(ob, axis, frames_values):
    for f, v in frames_values:
        r = list(ob.rotation_euler)
        r[axis] = v
        ob.rotation_euler = r
        ob.keyframe_insert("rotation_euler", index=axis, frame=f)


def ribbon_curve(name, points, material, width=12 * mm, cyclic=True):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for p, co in zip(sp.points, points):
        p.co = (*co, 1)
    sp.use_cyclic_u = cyclic
    cu.extrude = width / 2  # a flat band
    cu.bevel_depth = 0.0
    cu.offset = 0
    cu.twist_mode = "Z_UP"
    ob = bpy.data.objects.new(name, cu)
    lib.link(ob)
    cu.materials.append(material)
    return ob


def resample(points, step, cyclic=False):
    """Evenly spaced points along a polyline, so a Build reveal grows at an even pace."""
    pts = [Vector(p) for p in points]
    if cyclic:
        pts.append(pts[0])
    out = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        n = max(1, int((b - a).length / step))
        for k in range(1, n + 1):
            out.append(a.lerp(b, k / n))
    return out


def strip(name, points, side, width, material, thickness=0.3 * mm, cyclic=False, step=1.0 * mm):
    """A satin ribbon: a flat band swept along `points`, its width held along `side`
    (a constant direction, or a function of the point), given body with Solidify.
    Faces are created in path order, so a Build modifier draws it on from the start."""
    pts = resample(points, step, cyclic)
    bm = bmesh.new()
    rows = []
    for p in pts:
        sd = side(p) if callable(side) else Vector(side)
        sd = sd.normalized() * (width / 2)
        rows.append((bm.verts.new(p - sd), bm.verts.new(p + sd)))
    for (a0, a1), (b0, b1) in zip(rows, rows[1:]):
        bm.faces.new((a0, b0, b1, a1))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = lib.mesh_object(name, me, material)
    sol = ob.modifiers.new("Body", "SOLIDIFY")
    sol.thickness = thickness
    sol.offset = 1.0
    return ob


def build_on(ob, start, length):
    m = ob.modifiers.new("Draw", "BUILD")
    m.frame_start = start
    m.frame_duration = length
    m.use_random_order = False
    # Build must come before Solidify so the band grows with its thickness.
    ob.modifiers.move(len(ob.modifiers) - 1, 0)
    return m


def rounded_loop_xz(hw, top, bottom, r):
    """A path around the box in the XZ plane with rounded corners, starting at top centre."""
    pts = [(0, 0, top), (hw - r, 0, top)]
    for k in range(1, 7):
        a = math.pi / 2 * k / 6
        pts.append((hw - r + r * math.sin(a), 0, top - r + r * math.cos(a)))
    pts += [(hw, 0, bottom + r)]
    for k in range(1, 7):
        a = math.pi / 2 * k / 6
        pts.append((hw - r + r * math.cos(a), 0, bottom + r - r * math.sin(a)))
    pts += [(-hw + r, 0, bottom)]
    for k in range(1, 7):
        a = math.pi / 2 * k / 6
        pts.append((-hw + r - r * math.sin(a), 0, bottom + r - r * math.cos(a)))
    pts += [(-hw, 0, top - r)]
    for k in range(1, 7):
        a = math.pi / 2 * k / 6
        pts.append((-hw + r - r * math.cos(a), 0, top - r + r * math.sin(a)))
    pts.append((0, 0, top))
    return pts


def build():
    scene = lib.reset("Platera_Gift")
    lib.cycles(scene, samples=int(arg("--samples", 160)), width=900 if portrait else 1600, height=1600 if portrait else 900)
    scene.render.resolution_percentage = int(arg("--scale", 100))
    scene.frame_start, scene.frame_end = 1, FRAMES
    scene.render.fps = 30
    scene.view_settings.exposure = float(arg("--ev", -0.6))
    lib.studio_world(strength=float(arg("--world", 0.55)), rotation=math.radians(40))
    silk_field(lib.champagne_silk())

    # The box itself (seen only before the top flaps close).
    shell, _ = lib._principled("Box", **{"Base Color": (0.9, 0.78, 0.58, 1), "Roughness": 0.5, "Sheen Weight": 0.5})
    box_shell("Box", W, D, H, shell).location = (0, 0, H / 2)

    paper = paper_material()
    # The open sheet under the box.
    under = flap("Under", (W + 2 * T, D + 2 * T), paper)
    under.location = (0, -(D + 2 * T) / 2, 0)

    # Side flaps (±X), hinged at the box's bottom side edges.
    sides = []
    for s in (-1, 1):
        p = pivot(f"SidePivot{s}", location=(s * W / 2, 0, 0), rotation=(0, 0, -s * math.pi / 2))
        f = flap(f"Side{s}", (D + 2 * T, H), paper)
        f.parent = p
        f.location = (0, 0, 0)
        f.rotation_euler = (0, 0, 0)
        # Local frame: the flap extends along +Y of the pivot; rotate it from flat to upright.
        f.location = (-(D + 2 * T) / 2 * 0, 0, 0)
        sides.append(p)
    # Front/back flaps (±Y) with a top flap on each.
    ends = []
    tops = []
    for s in (-1, 1):
        p = pivot(f"EndPivot{s}", location=(0, s * D / 2, 0), rotation=(0, 0, 0 if s > 0 else math.pi))
        f = flap(f"End{s}", (W + 4 * T, H), paper)
        f.parent = p
        tp = pivot(f"TopPivot{s}", parent=p, location=(0, H + (2.2 * T if s < 0 else 0), 0))  # the front flap lies over the back
        tf = flap(f"Top{s}", (W + 4 * T, D / 2 + (9 * mm if s < 0 else 3 * mm)), paper)
        tf.parent = tp
        ends.append(p)
        tops.append(tp)

    # Fold choreography. A flap lying flat on the silk has its pivot rotated so it points
    # outward (rx = 0 → flat along +Y outward after the pivot's own yaw); standing up is rx = +90°.
    def fold(ob, start, end, axis=0, a0=0.0, a1=math.pi / 2):
        vals = []
        for f in range(1, FRAMES + 1):
            t = (f - start) / (end - start)
            vals.append((f, a0 + (a1 - a0) * (settle(t) if t > 0 else 0)))
        key_rot(ob, axis, vals)

    for p in sides:
        fold(p, 20, 45)
    for p in ends:
        fold(p, 45, 70)
    fold(tops[1], 70, 86)  # back top flap first
    fold(tops[0], 84, 100)  # front overlaps it

    # Ribbon: gold satin, two bands drawn on around the box from the knot at the top centre.
    rib = satin()
    top = H + 2 * T + 0.2 * mm
    hw, hd = W / 2 + 2.6 * T, D / 2 + 2.6 * T
    bx = strip("BandX", rounded_loop_xz(hw, top, -0.2 * mm, 1.6 * mm), (0, 1, 0), 13 * mm, rib)
    build_on(bx, 100, 22)
    by = strip("BandY", [(0, x, z) for (x, _, z) in rounded_loop_xz(hd, top + 0.35 * mm, -0.1 * mm, 1.6 * mm)], (1, 0, 0), 13 * mm, rib)
    build_on(by, 118, 22)

    # The bow: two loops standing up from the knot, two tails lying across the lid, and
    # the knot itself, all blooming open from the centre.
    bow = pivot("Bow", location=(0, 0, top + 0.5 * mm))
    for sgn in (-1, 1):
        pts = []
        for k in range(49):
            a = 2 * math.pi * k / 48
            # A teardrop: pinched at the knot, full at the outer end, lifted off the lid.
            x = sgn * (23 * mm) * (1 - math.cos(a)) / 2
            z = (13 * mm) * math.sin(a) * (0.35 + 0.65 * (1 - math.cos(a)) / 2) + 5 * mm * (1 - math.cos(a)) / 2
            pts.append((x, 0, z))
        lp = strip(f"Loop{sgn}", pts, (0, 1, 0), 12 * mm, rib, cyclic=True, step=0.6 * mm)
        lp.parent = bow
        lp.rotation_euler = (0, 0, sgn * math.radians(14))
        tail = strip(
            f"Tail{sgn}",
            [(0, 0, 0), (sgn * 6 * mm, -8 * mm, -0.3 * mm), (sgn * 12 * mm, -18 * mm, -0.4 * mm), (sgn * 15 * mm, -27 * mm, -0.4 * mm)],
            lambda p, s=sgn: Vector((1, s * 0.35, 0)),
            11 * mm,
            rib,
            step=0.6 * mm,
        )
        tail.parent = bow
    knot = box_shell("Knot", 12 * mm, 10 * mm, 5 * mm, rib, bevel=2.2 * mm)
    knot.parent = bow
    knot.location = (0, 0, 2 * mm)
    for f in range(1, FRAMES + 1):
        t = (f - 140) / 22
        sc = 0.0 if t <= 0 else min(1.12, settle(t))
        bow.scale = (max(sc, 1e-4),) * 3
        bow.keyframe_insert("scale", frame=f)

    # The tag: drops on its thread from above, then swings to rest.
    tag_mat = bpy.data.materials.new("Tag")
    tag_mat.use_nodes = True
    tb = tag_mat.node_tree.nodes["Principled BSDF"]
    ti = tag_mat.node_tree.nodes.new("ShaderNodeTexImage")
    ti.image = bpy.data.images.load(os.path.join(OUT, "tag.png"))
    tag_mat.node_tree.links.new(ti.outputs["Color"], tb.inputs["Base Color"])
    tb.inputs["Roughness"].default_value = 0.6
    tag_pivot = pivot("TagPivot", location=(9 * mm, -12 * mm, top + 2 * mm))
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    bmesh.ops.scale(bm, vec=(34 * mm, 20 * mm, 1), verts=bm.verts)
    me = bpy.data.meshes.new("Tag")
    bm.to_mesh(me)
    bm.free()
    uv = me.uv_layers.new()
    for li, loop in enumerate(me.loops):
        co = me.vertices[loop.vertex_index].co
        uv.data[li].uv = (co.x / (34 * mm) + 0.5, co.y / (20 * mm) + 0.5)
    tag = lib.mesh_object("Tag", me, tag_mat, smooth=False)
    tag.parent = tag_pivot
    tag.location = (16 * mm, -18 * mm, 0)
    tag.rotation_euler = (math.radians(70), 0, math.radians(-20))
    for f in range(1, FRAMES + 1):
        t = (f - 162) / 10
        drop = 0 if t >= 1 else (1 - max(0, t)) * 60 * mm
        tag_pivot.location = (9 * mm, -12 * mm, top + 2 * mm + drop)
        sw = 0 if f < 170 else math.radians(16) * math.exp(-(f - 170) / 9) * math.sin((f - 170) * 0.42)
        tag_pivot.rotation_euler = (sw, 0, 0)
        tag_pivot.keyframe_insert("location", frame=f)
        tag_pivot.keyframe_insert("rotation_euler", frame=f)
        tag.hide_render = f < 162
        tag.keyframe_insert("hide_render", frame=f)

    # Camera: three-quarter from front-left, above; a slow orbit through the wrapping.
    focus = pivot("Focus", location=(0, 0, H * 0.6))
    if portrait:
        cam = lib.camera("Camera", (-0.18, -0.36, 0.3), (0, 0, H * 0.35), lens=70, fstop=5.6, focus=focus)
    else:
        cam = lib.camera("Camera", (-0.2, -0.3, 0.2), (0, 0, H * 0.45), lens=75, fstop=5.0, focus=focus)
    # Landscape: the gift sits in the right third, leaving the left for the words.
    if not portrait:
        cam.data.shift_x = -0.2
        cam.data.lens = 62
    else:
        cam.data.shift_y = 0.12
    start = cam.location.copy()
    for f in range(1, FRAMES + 1):
        a = math.radians(-12) * (f / FRAMES)
        x = start.x * math.cos(a) - start.y * math.sin(a)
        y = start.x * math.sin(a) + start.y * math.cos(a)
        cam.location = (x, y, start.z)
        lib.aim(cam, (0, 0, H * 0.4))
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)

    lib.area_light("Key", (-0.35, -0.2, 0.4), (0, 0, 0.02), 0.35, float(arg("--key", 9)), color=(1.0, 0.88, 0.7))
    lib.area_light("Rim", (0.2, 0.4, 0.25), (0, 0, 0.03), 0.25, 5, color=(1.0, 0.8, 0.5))
    lib.softbox_card("Strip", (0.3, -0.15, 0.2), (0, 0, 0.03), 0.04, 0.3, 3, color=(1, 0.97, 0.92))
    return scene


if __name__ == "__main__":
    scene = build()
    os.makedirs(OUT, exist_ok=True)
    if "--still" in args:
        f = int(arg("--still"))
        scene.frame_set(f)
        scene.render.filepath = os.path.join(OUT, f"gift{'_portrait' if portrait else ''}_still_{f:04d}.png")
        bpy.ops.render.render(write_still=True)
    elif "--anim" in args:
        d = os.path.join(OUT, "gift_portrait" if portrait else "gift")
        os.makedirs(d, exist_ok=True)
        scene.render.filepath = os.path.join(d, "")
        if "--start" in args:
            scene.frame_start = int(arg("--start"))
        bpy.ops.render.render(animation=True)
