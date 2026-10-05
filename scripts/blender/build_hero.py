"""
Builds the Platera hero scene in Blender: the emblem ring on a marble plinth,
lit like a jewellery photograph, rendered with a transparent background so it
sits directly on the website's ivory ground.

Run inside Blender (via the MCP connector, or):
    blender --background --python scripts/blender/build_hero.py

Everything is at true scale in metres: the ring's inner diameter is 17.8 mm
(Indian size ~14), the centre stone 6.5 mm (about one carat).
Saves assets/blender/hero.blend when done.
"""
import math
import os

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = r"C:\Users\User\platera"
OUT = os.path.join(ROOT, "assets", "blender")
HDRI = os.path.join(ROOT, "public", "hdri", "studio_small_09_2k.hdr")
mm = 0.001
R = 9.7 * mm          # band centreline radius
STONE_R = 3.25 * mm   # centre stone girdle radius (6.5 mm)
os.makedirs(OUT, exist_ok=True)


# ── Scene, renderer, environment ────────────────────────────────────────────
def setup_scene():
    # Clear everything from a previous build (data API, so it works in any context).
    for coll in (bpy.data.objects, bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.lights, bpy.data.cameras, bpy.data.images, bpy.data.worlds):
        for item in list(coll):
            coll.remove(item)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    scene = bpy.context.scene
    scene.name = "Platera_Hero"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "OPTIX"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type == "OPTIX"
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.samples = 256
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPTIX"
    scene.cycles.max_bounces = 16
    scene.cycles.transmission_bounces = 16
    scene.cycles.glossy_bounces = 12
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"

    world = bpy.data.worlds.new("Studio")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    tex = nt.nodes.new("ShaderNodeTexEnvironment")
    tex.image = bpy.data.images.load(HDRI)
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.name = "EnvMap"
    coord = nt.nodes.new("ShaderNodeTexCoord")
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.name = "EnvBG"
    bg.inputs["Strength"].default_value = 0.9
    out = nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(coord.outputs["Generated"], mapping.inputs["Vector"])
    nt.links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
    nt.links.new(tex.outputs["Color"], bg.inputs["Color"])
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
    return scene


def collection(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c


def move_to(ob, coll):
    for c in list(ob.users_collection):
        c.objects.unlink(ob)
    coll.objects.link(ob)
    return ob



# ── Geometry helpers (data API only: no operators, so the script runs in any context) ──
def torus_mesh(name, major, minor, seg_u=192, seg_v=16):
    bm = bmesh.new()
    rings = []
    for i in range(seg_u):
        u = 2 * math.pi * i / seg_u
        ring = []
        for j in range(seg_v):
            v = 2 * math.pi * j / seg_v
            x = (major + minor * math.cos(v)) * math.cos(u)
            y = (major + minor * math.cos(v)) * math.sin(u)
            z = minor * math.sin(v)
            ring.append(bm.verts.new((x, y, z)))
        rings.append(ring)
    for i in range(seg_u):
        for j in range(seg_v):
            a, b = rings[i][j], rings[(i + 1) % seg_u][j]
            c, d = rings[(i + 1) % seg_u][(j + 1) % seg_v], rings[i][(j + 1) % seg_v]
            bm.faces.new((a, b, c, d))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    return me


def curve_to_mesh(curve_obj, name):
    """Evaluate a bevelled curve object into a standalone mesh object, then delete the curve."""
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(curve_obj.evaluated_get(dg))
    me.name = name
    colls = list(curve_obj.users_collection)
    data = curve_obj.data
    bpy.data.objects.remove(curve_obj, do_unlink=True)
    bpy.data.curves.remove(data)
    ob = bpy.data.objects.new(name, me)
    for c in colls:
        c.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = True
    return ob


def box_mesh(name, sx, sy, sz):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return me


def plane_mesh(name, sx, sy):
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    bmesh.ops.scale(bm, vec=(sx, sy, 1), verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return me


# ── Materials ───────────────────────────────────────────────────────────────
def principled(name, **inputs):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    for k, v in inputs.items():
        b.inputs[k].default_value = v
    return m


def materials():
    silver = principled("Silver925", **{"Base Color": (0.96, 0.955, 0.95, 1), "Metallic": 1.0, "Roughness": 0.07, "Anisotropic": 0.35})
    gold = principled("AntiqueGold", **{"Base Color": (0.86, 0.66, 0.38, 1), "Metallic": 1.0, "Roughness": 0.18})
    stone = principled("WhiteStone", **{"Base Color": (1, 1, 1, 1), "Roughness": 0.0, "IOR": 2.15, "Transmission Weight": 1.0})
    b = stone.node_tree.nodes["Principled BSDF"]
    if "Dispersion" in b.inputs:
        b.inputs["Dispersion"].default_value = 0.6  # the colour "fire" at the facets
    black = principled("BlackCard", **{"Base Color": (0.004, 0.004, 0.004, 1), "Roughness": 0.9})
    return silver, gold, stone, black


def marble_material(stone_rgb, vein_rgb):
    """White marble with thin grey veins traced along contour lines of a warped noise field."""
    m = bpy.data.materials.new("Marble")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.25
    b.inputs["Coat Weight"].default_value = 0.35
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (90, 90, 90)
    warp = nt.nodes.new("ShaderNodeTexNoise")
    warp.inputs["Scale"].default_value = 1.2
    warp.inputs["Detail"].default_value = 4
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "VECTOR"
    mix.inputs["Factor"].default_value = 0.6
    vein = nt.nodes.new("ShaderNodeTexNoise")
    vein.inputs["Scale"].default_value = 1.6
    vein.inputs["Detail"].default_value = 10
    vein.inputs["Roughness"].default_value = 0.62
    sub = nt.nodes.new("ShaderNodeMath")
    sub.operation = "SUBTRACT"
    sub.inputs[1].default_value = 0.5
    ab = nt.nodes.new("ShaderNodeMath")
    ab.operation = "ABSOLUTE"
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.name = "MarbleRamp"
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[1].position = 0.035
    ramp.color_ramp.elements[0].color = (*vein_rgb, 1)
    ramp.color_ramp.elements[1].color = (*stone_rgb, 1)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], warp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], mix.inputs["A"])
    nt.links.new(warp.outputs["Color"], mix.inputs["B"])
    nt.links.new(mix.outputs["Result"], vein.inputs["Vector"])
    nt.links.new(vein.outputs["Fac"], sub.inputs[0])
    nt.links.new(sub.outputs["Value"], ab.inputs[0])
    nt.links.new(ab.outputs["Value"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    return m


# ── The ring ────────────────────────────────────────────────────────────────
def brilliant(name, r=1.0):
    """Round brilliant from its facet vertices: convex hull, then coplanar triangles merged into facets."""
    bm = bmesh.new()

    def ring(radius, z, count, offset=0.0):
        for i in range(count):
            a = 2 * math.pi * (i + offset) / count
            bm.verts.new((radius * math.cos(a), radius * math.sin(a), z))

    crown_h, pav_d = 0.162 * r, 0.431 * r
    ring(0.57 * r, crown_h, 8, 0.0)       # table
    ring(0.79 * r, crown_h * 0.48, 8, 0.5)  # star / bezel points
    ring(r, 0.012 * r, 16, 0.0)           # upper girdle
    ring(r, -0.012 * r, 16, 0.0)          # lower girdle
    ring(0.80 * r, -pav_d * 0.42, 8, 0.5)  # lower girdle facets
    bm.verts.new((0, 0, -pav_d))          # culet
    bmesh.ops.convex_hull(bm, input=bm.verts)
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(0.5), verts=bm.verts, edges=bm.edges)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = False
    return me


def build_ring(coll, silver, gold, stone_mat):
    # Band: a circle swept with a round profile, widened along the ring axis (comfort-fit oval).
    cu = bpy.data.curves.new("BandCurve", "CURVE")
    cu.dimensions = "3D"
    sp = cu.splines.new("POLY")
    n = 256
    sp.points.add(n - 1)
    for i in range(n):
        a = 2 * math.pi * i / n
        sp.points[i].co = (R * math.cos(a), 0, R * math.sin(a), 1)
    sp.use_cyclic_u = True
    cu.bevel_mode = "ROUND"
    cu.bevel_depth = 0.8 * mm
    cu.bevel_resolution = 12
    band_curve = bpy.data.objects.new("BandCurveObj", cu)
    coll.objects.link(band_curve)
    band = curve_to_mesh(band_curve, "Band")
    band.data.transform(Matrix.Diagonal((1, 1.35, 1, 1)))  # widen along the ring axis
    band.data.materials.append(silver)

    rim = bpy.data.objects.new("GoldRim", torus_mesh("GoldRim", R - 0.78 * mm, 0.14 * mm, 256, 12))
    coll.objects.link(rim)
    rim.rotation_euler = (math.pi / 2, 0, 0)
    rim.data.materials.append(gold)

    girdle_z = R + 0.8 * mm + 1.7 * mm + 0.431 * STONE_R
    stone = bpy.data.objects.new("CenterStone", brilliant("CenterStoneMesh"))
    coll.objects.link(stone)
    stone.scale = (STONE_R,) * 3
    stone.location = (0, 0, girdle_z)
    stone.data.materials.append(stone_mat)

    gal = bpy.data.objects.new("Gallery", torus_mesh("Gallery", 1.9 * mm, 0.26 * mm, 96, 16))
    coll.objects.link(gal)
    gal.location = (0, 0, girdle_z - 0.95 * mm)
    gal.data.materials.append(silver)

    ccu = bpy.data.curves.new("ClawCurve", "CURVE")
    ccu.dimensions = "3D"
    ccu.bevel_mode = "ROUND"
    ccu.bevel_depth = 0.30 * mm
    ccu.bevel_resolution = 6
    base_z = R + 0.6 * mm
    for k in range(6):
        a = 2 * math.pi * k / 6 + math.pi / 6
        pts = [(1.2 * mm, base_z, 1.0), (2.4 * mm, girdle_z - 1.0 * mm, 1.0), (3.35 * mm, girdle_z + 0.05 * mm, 0.85), (3.05 * mm, girdle_z + 0.42 * mm, 0.55)]
        s = ccu.splines.new("NURBS")
        s.points.add(len(pts) - 1)
        for i, (rr, z, rad) in enumerate(pts):
            s.points[i].co = (rr * math.cos(a), rr * math.sin(a), z, 1)
            s.points[i].radius = rad
        s.use_endpoint_u = True
        s.order_u = 3
    claws_curve = bpy.data.objects.new("ClawsCurveObj", ccu)
    coll.objects.link(claws_curve)
    claws = curve_to_mesh(claws_curve, "Claws")
    claws.data.materials.append(silver)

    # Pavé: 16 small brilliants across the shoulders, bead prongs between them.
    small = brilliant("PaveStoneMesh")
    step = math.radians(7.2)
    angles = [math.pi / 2 + side * (math.radians(17) + j * step) for side in (-1, 1) for j in range(8)]
    pave = bmesh.new()
    prongs = bmesh.new()
    for a in angles:
        out = Vector((math.cos(a), 0, math.sin(a)))
        m = Matrix.Translation(out * (R + 0.66 * mm)) @ out.to_track_quat("Z", "Y").to_matrix().to_4x4() @ Matrix.Scale(0.62 * mm, 4)
        tmp = bmesh.new()
        tmp.from_mesh(small)
        bmesh.ops.transform(tmp, matrix=m, verts=tmp.verts)
        me_tmp = bpy.data.meshes.new("tmp")
        tmp.to_mesh(me_tmp)
        tmp.free()
        pave.from_mesh(me_tmp)
        bpy.data.meshes.remove(me_tmp)
        for e in (-1, 1):
            b = a + step / 2
            po = Vector((math.cos(b), 0, math.sin(b))) * (R + 0.72 * mm) + Vector((0, e * 0.62 * mm, 0))
            bmesh.ops.create_uvsphere(prongs, u_segments=10, v_segments=6, radius=0.2 * mm, matrix=Matrix.Translation(po))
    pm = bpy.data.meshes.new("Pave")
    pave.to_mesh(pm)
    pave.free()
    for p in pm.polygons:
        p.use_smooth = False
    po = bpy.data.objects.new("Pave", pm)
    coll.objects.link(po)
    po.data.materials.append(stone_mat)
    prm = bpy.data.meshes.new("Prongs")
    prongs.to_mesh(prm)
    prongs.free()
    for p in prm.polygons:
        p.use_smooth = True
    pr = bpy.data.objects.new("Prongs", prm)
    coll.objects.link(pr)
    pr.data.materials.append(silver)
    bpy.data.meshes.remove(small)


# ── The set: plinth, shadow-catching floor, black reflector cards ──────────
def build_set(coll, marble, black):
    plinth_top = -1.4 * mm
    pl = bpy.data.objects.new("Plinth", box_mesh("Plinth", 60 * mm, 34 * mm, 18 * mm))
    coll.objects.link(pl)
    pl.location = (0, 0, plinth_top - 9 * mm)
    bev = pl.modifiers.new("Bevel", "BEVEL")
    bev.width = 1.2 * mm
    bev.segments = 6
    pl.data.materials.append(marble)

    fl = bpy.data.objects.new("Floor", plane_mesh("Floor", 0.9, 0.9))
    coll.objects.link(fl)
    fl.location = (0, 0, plinth_top - 18 * mm)
    fl.is_shadow_catcher = True

    # Ring sits 0.35 mm into a slot in the plinth top.
    lowest = -(R + 0.8 * mm)
    lift = plinth_top - lowest - 0.35 * mm
    for o in bpy.data.collections["Emblem"].objects:
        o.location.z += lift

    # Black cards: never seen by the camera, only reflected in the metal and the stones.
    look = Vector((0, 0, 0.011))
    for name, loc, sx, sy in [
        ("CardL", (-0.07, -0.02, 0.03), 0.05, 0.12),
        ("CardR", (0.07, -0.04, 0.025), 0.04, 0.12),
        ("CardTop", (0.0, -0.03, 0.09), 0.10, 0.06),
        ("CardBack", (0.0, 0.08, 0.02), 0.16, 0.08),
    ]:
        o = bpy.data.objects.new(name, plane_mesh(name, 1, 1))
        coll.objects.link(o)
        o.location = loc
        o.scale = (sx, sy, 1)
        o.rotation_euler = (look - Vector(loc)).to_track_quat("Z", "Y").to_euler()
        o.data.materials.append(black)
        o.visible_camera = False
        o.visible_shadow = False
    return plinth_top


# ── Camera and lights ───────────────────────────────────────────────────────
def camera_and_lights(scene):
    look = Vector((0, 0, 9.0 * mm))
    cd = bpy.data.cameras.new("Cam")
    cd.lens = 120
    cd.clip_start = 0.002
    cd.dof.use_dof = True
    cd.dof.aperture_fstop = 2.8
    cd.dof.focus_object = bpy.data.objects["CenterStone"]
    cam = bpy.data.objects.new("Cam", cd)
    scene.collection.objects.link(cam)
    cam.location = (-0.045, -0.24, 0.016)
    aim = Vector((-0.012, 0, 0.011))
    cam.rotation_euler = (aim - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam

    def area(name, loc, size, energy, size_y=None, color=(1.0, 0.96, 0.9)):
        d = bpy.data.lights.new(name, "AREA")
        d.energy = energy
        d.color = color
        d.shape = "RECTANGLE"
        d.size = size
        d.size_y = size_y or size
        o = bpy.data.objects.new(name, d)
        scene.collection.objects.link(o)
        o.location = loc
        o.rotation_euler = (look - Vector(loc)).to_track_quat("-Z", "Y").to_euler()

    area("Key", (-0.17, -0.10, 0.10), 0.22, 7)
    area("RimL", (-0.16, 0.10, 0.03), 0.02, 6, size_y=0.30)
    area("RimR", (0.16, 0.10, 0.03), 0.02, 6, size_y=0.30)
    area("Top", (0, 0.0, 0.24), 0.15, 0.6)


def build():
    scene = setup_scene()
    emblem = collection("Emblem")
    setc = collection("Set")
    silver, gold, stone, black = materials()
    marble = marble_material((0.62, 0.60, 0.57), (0.33, 0.315, 0.30))
    build_ring(emblem, silver, gold, stone)
    build_set(setc, marble, black)
    camera_and_lights(scene)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "hero.blend"))
    return scene


if __name__ == "__main__":
    build()
