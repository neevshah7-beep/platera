"""
Shared Blender helpers for Platera's rendered scenes: renderer setup, the jewellery
materials (18k yellow gold, diamond with dispersion, champagne silk), the studio light
rig, and true-scale geometry for the hero solitaire.

Every scene script imports this file. Units are metres; jewellery is modelled at true
size (ring inner diameter 17.8 mm, centre stone 6.5 mm ≈ 1 ct).
"""
import math

import bmesh
import bpy
from mathutils import Vector

mm = 0.001


# ── Scene and renderer ──────────────────────────────────────────────────────
def reset(name: str):
    for coll in (bpy.data.objects, bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.lights, bpy.data.cameras, bpy.data.images, bpy.data.worlds, bpy.data.node_groups):
        for item in list(coll):
            coll.remove(item)
    scene = bpy.context.scene
    scene.name = name
    return scene


def cycles(scene, samples=128, width=1600, height=900, transparent=False):
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "OPTIX"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type == "OPTIX"
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.samples = samples
    scene.cycles.adaptive_threshold = 0.015
    scene.cycles.use_denoising = True
    # OpenImageDenoise with albedo + normal guidance on its high-quality setting keeps the
    # crisp facet pattern of a diamond that OptiX smears into cloud.
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    scene.cycles.denoising_input_passes = "RGB_ALBEDO_NORMAL"
    scene.cycles.denoising_prefilter = "ACCURATE"
    if hasattr(scene.cycles, "denoising_quality"):
        scene.cycles.denoising_quality = "HIGH"
    if hasattr(scene.cycles, "denoising_use_gpu"):
        scene.cycles.denoising_use_gpu = True
    scene.cycles.max_bounces = 18
    scene.cycles.glossy_bounces = 12
    scene.cycles.transmission_bounces = 18
    scene.cycles.caustics_reflective = True
    scene.cycles.caustics_refractive = True
    scene.cycles.blur_glossy = 0.4
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = transparent
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA" if transparent else "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Punchy"
    scene.view_settings.exposure = 0.0


def link(ob, scene=None):
    (scene or bpy.context.scene).collection.objects.link(ob)
    return ob


def mesh_object(name, me, material=None, smooth=True):
    ob = bpy.data.objects.new(name, me)
    if material is not None:
        me.materials.append(material)
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    return link(ob)


# ── Materials ───────────────────────────────────────────────────────────────
def _principled(name, **inputs):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    for k, v in inputs.items():
        b.inputs[k].default_value = v
    return m, b


def gold_18k():
    """18k yellow gold: measured-ish F0 (1.0, 0.78, 0.38), polished, with a faint brushed
    anisotropy and a noise-broken roughness so highlights break up as on real metal."""
    m, b = _principled("Gold18k", **{"Base Color": (1.0, 0.77, 0.36, 1), "Metallic": 1.0, "Roughness": 0.11, "Anisotropic": 0.25})
    nt = m.node_tree
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 900.0
    noise.inputs["Detail"].default_value = 6
    ramp = nt.nodes.new("ShaderNodeMapRange")
    ramp.inputs["To Min"].default_value = 0.08
    ramp.inputs["To Max"].default_value = 0.16
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Value"])
    nt.links.new(ramp.outputs["Result"], b.inputs["Roughness"])
    return m


def diamond():
    """Diamond: IOR 2.417, dispersion (Abbe ≈ 55) for fire, zero roughness."""
    m, b = _principled("Diamond", **{"Base Color": (1, 1, 1, 1), "Roughness": 0.0, "IOR": 2.417, "Transmission Weight": 1.0})
    if "Dispersion" in b.inputs:
        b.inputs["Dispersion"].default_value = 1.0 / 55.0 * 20  # Blender's dispersion scale
    return m


def champagne_silk(base=(0.76, 0.45, 0.13)):
    """Champagne silk charmeuse: a warm base, strong sheen at grazing angles, and an
    anisotropic specular along the weave so folds carry long soft highlights."""
    m, b = _principled(
        "ChampagneSilk",
        **{
            "Base Color": (*base, 1),
            "Roughness": 0.32,
            "Specular IOR Level": 0.6,
            "Anisotropic": 0.65,
            "Sheen Weight": 1.0,
            "Sheen Roughness": 0.35,
            "Sheen Tint": (1.0, 0.92, 0.75, 1),
        },
    )
    nt = m.node_tree
    # A fine woven texture in the bump so the sheen shimmers like charmeuse, not plastic.
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.inputs["Scale"].default_value = 2400.0
    wave.inputs["Distortion"].default_value = 1.5
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.04
    nt.links.new(wave.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


def emitter(name, strength, color=(1, 1, 1)):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Strength"].default_value = strength
    e.inputs["Color"].default_value = (*color, 1)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(e.outputs["Emission"], out.inputs["Surface"])
    return m


# ── World and lights ────────────────────────────────────────────────────────
def warm_world(strength=0.6, top=(1.0, 0.86, 0.62), bottom=(0.55, 0.38, 0.18)):
    """A warm gradient sky: honey below, champagne above. Gold reflects it everywhere."""
    w = bpy.data.worlds.new("WarmStudio")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    coord = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = (*bottom, 1)
    ramp.color_ramp.elements[1].position = 0.75
    ramp.color_ramp.elements[1].color = (*top, 1)
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = -1
    mr.inputs["From Max"].default_value = 1
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Strength"].default_value = strength
    out = nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(coord.outputs["Normal"], sep.inputs["Vector"])
    nt.links.new(sep.outputs["Z"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
    return w


def area_light(name, location, target, size, energy, color=(1.0, 0.93, 0.82), shape="RECTANGLE", size_y=None):
    li = bpy.data.lights.new(name, "AREA")
    li.energy = energy
    li.color = color
    li.shape = shape
    li.size = size
    if size_y is not None:
        li.size_y = size_y
    ob = bpy.data.objects.new(name, li)
    ob.location = location
    aim(ob, target)
    return link(ob)


def aim(ob, target):
    d = Vector(target) - Vector(ob.location)
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def softbox_card(name, location, target, w, h, strength, color=(1, 0.95, 0.86)):
    """A visible emissive card: gives metal a long, shaped highlight (what jewellery
    photographers use strip boxes for)."""
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    bmesh.ops.scale(bm, vec=(w, h, 1), verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = mesh_object(name, me, emitter(name + "Mat", strength, color), smooth=False)
    ob.location = location
    aim(ob, target)
    ob.visible_camera = False
    return ob


def camera(name, location, target, lens=100, fstop=2.8, focus=None, sensor=36):
    cam = bpy.data.cameras.new(name)
    cam.lens = lens
    cam.sensor_width = sensor
    cam.clip_start = 0.001
    cam.clip_end = 50
    cam.dof.use_dof = True
    cam.dof.aperture_fstop = fstop
    cam.dof.aperture_blades = 9
    cam.dof.aperture_rotation = math.radians(10)
    ob = bpy.data.objects.new(name, cam)
    ob.location = location
    aim(ob, target)
    link(ob)
    if focus is not None:
        cam.dof.focus_object = focus
    bpy.context.scene.camera = ob
    return ob


# ── Geometry: the hero solitaire ─────────────────────────────────────────────
def _torus(name, major, minor_r, minor_z, seg_u=256, seg_v=28, top_taper=0.0):
    """A band with an elliptical cross-section (radial thickness minor_r, width minor_z).
    top_taper narrows the band toward the head (+Y up the ring)."""
    bm = bmesh.new()
    rings = []
    for i in range(seg_u):
        u = 2 * math.pi * i / seg_u
        k = 1.0 - top_taper * max(0.0, math.sin(u)) ** 3
        ring = []
        for j in range(seg_v):
            v = 2 * math.pi * j / seg_v
            r = major + minor_r * k * math.cos(v)
            ring.append(bm.verts.new((r * math.cos(u), r * math.sin(u), minor_z * k * math.sin(v))))
        rings.append(ring)
    for i in range(seg_u):
        for j in range(seg_v):
            a, b = rings[i][j], rings[(i + 1) % seg_u][j]
            c, d = rings[(i + 1) % seg_u][(j + 1) % seg_v], rings[i][(j + 1) % seg_v]
            bm.faces.new((a, b, c, d))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return me


def brilliant(name, girdle_r, segments=16):
    """Round brilliant cut by its real proportions: table 57 %, crown angle 34.5°,
    pavilion angle 40.75°, a thin girdle, pointed culet. Built as the convex hull of the
    facet vertices, so the 57 facets fall out of the geometry."""
    bm = bmesh.new()
    table_r = girdle_r * 0.57
    crown_h = (girdle_r - table_r) * math.tan(math.radians(34.5))
    pav_h = girdle_r * math.tan(math.radians(40.75))
    gird_h = girdle_r * 0.03
    pts = []
    n8 = 8
    for i in range(n8):  # table octagon
        a = 2 * math.pi * i / n8
        pts.append((table_r * math.cos(a), table_r * math.sin(a), gird_h + crown_h))
    for i in range(n8):  # bezel/star apexes, between table and girdle
        a = 2 * math.pi * (i + 0.5) / n8
        r = (table_r + girdle_r) * 0.5 * 1.04
        pts.append((r * math.cos(a), r * math.sin(a), gird_h + crown_h * 0.52))
    for i in range(segments * 2):  # girdle, top and bottom edge
        a = 2 * math.pi * i / (segments * 2)
        pts.append((girdle_r * math.cos(a), girdle_r * math.sin(a), gird_h))
        pts.append((girdle_r * math.cos(a), girdle_r * math.sin(a), -gird_h))
    for i in range(n8):  # pavilion main apexes
        a = 2 * math.pi * (i + 0.5) / n8
        r = girdle_r * 0.42
        pts.append((r * math.cos(a), r * math.sin(a), -gird_h - pav_h * 0.58))
    pts.append((0, 0, -gird_h - pav_h))  # culet
    verts = [bm.verts.new(p) for p in pts]
    bmesh.ops.convex_hull(bm, input=verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return me


def prong_curve(name, points, radius):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = 6
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for p, co in zip(sp.points, points):
        p.co = (*co, 1)
    cu.splines[0].type = "NURBS"
    cu.splines[0].use_endpoint_u = True
    cu.splines[0].order_u = 4
    cu.resolution_u = 24
    ob = bpy.data.objects.new(name, cu)
    link(ob)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    bpy.data.objects.remove(ob, do_unlink=True)
    bpy.data.curves.remove(cu)
    return me


def solitaire(gold, stone, name="Solitaire"):
    """The hero ring, standing on its edge with the stone up (+Z). Returns the root empty."""
    root = bpy.data.objects.new(name, None)
    link(root)
    R = 9.6 * mm  # band centreline radius (inner Ø ≈ 17.8 mm with 0.9 mm half-thickness)
    band_me = _torus("Band", R, 0.9 * mm, 1.15 * mm, top_taper=0.28)
    band = mesh_object("Band", band_me, gold)
    band.rotation_euler = (math.radians(90), 0, 0)  # ring stands upright, plane XZ
    band.parent = root

    stone_r = 3.25 * mm
    head_z = R + 0.9 * mm + 2.6 * mm  # girdle height above ring centre
    gem = mesh_object("Stone", brilliant("Stone", stone_r), stone, smooth=False)
    gem.location = (0, 0, head_z)
    gem.parent = root

    # Six claws rising from a gallery ring under the stone, curling over the girdle.
    gallery = mesh_object("Gallery", _torus("Gallery", stone_r * 0.62, 0.32 * mm, 0.32 * mm, seg_u=96, seg_v=12), gold)
    gallery.location = (0, 0, head_z - 2.0 * mm)
    gallery.parent = root
    for i in range(6):
        a = 2 * math.pi * i / 6 + math.pi / 6
        ca, sa = math.cos(a), math.sin(a)
        pts = [
            (ca * stone_r * 0.35, sa * stone_r * 0.35, R + 0.6 * mm),
            (ca * stone_r * 0.62, sa * stone_r * 0.62, head_z - 2.0 * mm),
            (ca * stone_r * 1.06, sa * stone_r * 1.06, head_z - 0.2 * mm),
            (ca * stone_r * 1.02, sa * stone_r * 1.02, head_z + 0.75 * mm),
            (ca * stone_r * 0.86, sa * stone_r * 0.86, head_z + 1.05 * mm),
        ]
        prong = mesh_object(f"Claw{i}", prong_curve(f"Claw{i}", pts, 0.34 * mm), gold)
        prong.parent = root

    # Pavé down both shoulders: small brilliants set into the band's outer face.
    small = brilliant("Pave", 0.55 * mm, segments=8)
    for side in (-1, 1):
        for k in range(7):
            ang = math.radians(90 - side * (22 + k * 7.2))
            pos = Vector((math.cos(ang) * (R + 0.75 * mm), 0, math.sin(ang) * (R + 0.75 * mm)))
            p = mesh_object(f"Pave{side}_{k}", small.copy(), stone, smooth=False)
            p.location = pos
            normal = pos.normalized()
            p.rotation_euler = Vector((0, 0, 1)).rotation_difference(normal).to_euler()
            p.parent = root
    return root
