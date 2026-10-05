"""
A jewellery-studio environment map for the live WebGL scenes, rendered as a 360° HDR
(equirectangular EXR). Real-time gold is only as good as what it reflects, so this is
built the way a jewellery photographer builds a light tent:

  · a warm gradient tent: cream overhead, honey at the horizon, deep brown below, so
    polished gold always has a dark side to show its colour against;
  · two tall strip softboxes left and right and a broad overhead box, each with a soft
    radial falloff (no hard-edged rectangles, which read as shapes in a bead);
  · a ring of small bright points for scintillation.

  blender -b -P src/pipeline/blender/studio_env.py
Writes public/env/studio.exr (2048×1024, half float).
"""
import math
import os

import bpy

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUT = os.path.join(ROOT, "public", "env")
os.makedirs(OUT, exist_ok=True)

for coll in (bpy.data.objects, bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras, bpy.data.worlds):
    for item in list(coll):
        coll.remove(item)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == "OPTIX"
scene.cycles.device = "GPU"
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.render.resolution_x = 2048
scene.render.resolution_y = 1024
scene.render.image_settings.file_format = "OPEN_EXR"
scene.render.image_settings.color_depth = "16"
scene.render.image_settings.exr_codec = "DWAA"
scene.view_settings.view_transform = "Standard"

# The tent: a gradient world.
w = bpy.data.worlds.new("Tent")
scene.world = w
w.use_nodes = True
nt = w.node_tree
nt.nodes.clear()
coord = nt.nodes.new("ShaderNodeTexCoord")
sep = nt.nodes.new("ShaderNodeSeparateXYZ")
ramp = nt.nodes.new("ShaderNodeValToRGB")
els = ramp.color_ramp.elements
els[0].position, els[0].color = 0.0, (0.02, 0.012, 0.005, 1)
els[1].position, els[1].color = 0.5, (0.42, 0.27, 0.12, 1)
e = els.new(0.62)
e.color = (0.85, 0.66, 0.4, 1)
e = els.new(1.0)
e.color = (1.0, 0.92, 0.78, 1)
mr = nt.nodes.new("ShaderNodeMapRange")
mr.inputs["From Min"].default_value = 1   # world normals point inward: flip so up is bright
mr.inputs["From Max"].default_value = -1
bg = nt.nodes.new("ShaderNodeBackground")
bg.inputs["Strength"].default_value = 1.0
out = nt.nodes.new("ShaderNodeOutputWorld")
nt.links.new(coord.outputs["Normal"], sep.inputs["Vector"])
nt.links.new(sep.outputs["Z"], mr.inputs["Value"])
nt.links.new(mr.outputs["Result"], ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
nt.links.new(bg.outputs["Background"], out.inputs["Surface"])


def softbox(name, loc, size, strength, color=(1, 0.95, 0.86)):
    """A plane with emission that falls off radially from its centre: a diffused softbox."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (size[0], size[1], 1)
    d = -ob.location.normalized()
    ob.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    t = m.node_tree
    t.nodes.clear()
    tc = t.nodes.new("ShaderNodeTexCoord")
    grad = t.nodes.new("ShaderNodeTexGradient")
    grad.gradient_type = "SPHERICAL"
    mp = t.nodes.new("ShaderNodeMapping")
    mp.inputs["Location"].default_value = (0, 0, 0)
    mp.inputs["Scale"].default_value = (1.9, 1.9, 1)
    em = t.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (*color, 1)
    pw = t.nodes.new("ShaderNodeMath")
    pw.operation = "POWER"
    pw.inputs[1].default_value = 0.6
    mul = t.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul.inputs[1].default_value = strength
    o = t.nodes.new("ShaderNodeOutputMaterial")
    # Emission added to a fully transparent surface: the box glows, its plane never blocks the tent.
    tr = t.nodes.new("ShaderNodeBsdfTransparent")
    add = t.nodes.new("ShaderNodeAddShader")
    t.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    t.links.new(mp.outputs["Vector"], grad.inputs["Vector"])
    t.links.new(grad.outputs["Fac"], pw.inputs[0])
    t.links.new(pw.outputs[0], mul.inputs[0])
    t.links.new(mul.outputs[0], em.inputs["Strength"])
    t.links.new(em.outputs["Emission"], add.inputs[0])
    t.links.new(tr.outputs["BSDF"], add.inputs[1])
    t.links.new(add.outputs["Shader"], o.inputs["Surface"])
    ob.data.materials.append(m)
    return ob


from mathutils import Vector  # noqa: E402

softbox("StripL", Vector((-3.2, 0.6, 0.6)), (0.9, 3.6), 9.0)
softbox("StripR", Vector((3.0, -0.4, 0.4)), (0.8, 3.4), 6.5, color=(1.0, 0.97, 0.92))
softbox("Top", Vector((0.2, 0.3, 3.4)), (3.2, 2.2), 4.0)
softbox("Key", Vector((-1.4, -2.6, 1.6)), (1.4, 1.4), 12.0, color=(1.0, 0.9, 0.74))
softbox("Bounce", Vector((0.0, 2.8, -1.4)), (4.0, 1.2), 1.4, color=(0.95, 0.62, 0.28))
# Black flags between the boxes: polished gold needs dark bands to read as metal, not paint.
def flag(name, loc, size):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (size[0], size[1], 1)
    ob.rotation_euler = (-ob.location.normalized()).to_track_quat("Z", "Y").to_euler()
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.node_tree.nodes.clear()
    em = m.node_tree.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = 0.0
    o = m.node_tree.nodes.new("ShaderNodeOutputMaterial")
    m.node_tree.links.new(em.outputs["Emission"], o.inputs["Surface"])
    ob.data.materials.append(m)


flag("FlagL", Vector((-2.6, -2.0, 0.5)), (1.3, 4.2))
flag("FlagR", Vector((2.7, 1.8, 0.4)), (1.2, 4.0))
flag("FlagBack", Vector((0.4, 3.2, 0.9)), (1.6, 3.0))

for i in range(10):
    a = 2 * math.pi * i / 10
    softbox(f"Glint{i}", Vector((math.cos(a) * 3.0, math.sin(a) * 3.0, 1.9 + 0.4 * math.sin(a * 3))), (0.07, 0.07), 80.0, color=(1, 1, 1))

cam = bpy.data.cameras.new("Pano")
cam.type = "PANO"
if hasattr(cam, "panorama_type"):
    cam.panorama_type = "EQUIRECTANGULAR"
else:
    cam.cycles.panorama_type = "EQUIRECTANGULAR"
co = bpy.data.objects.new("Pano", cam)
scene.collection.objects.link(co)
co.rotation_euler = (math.radians(90), 0, 0)
scene.camera = co
scene.render.filepath = os.path.join(OUT, "studio.exr")
bpy.ops.render.render(write_still=True)
print("wrote", scene.render.filepath)
