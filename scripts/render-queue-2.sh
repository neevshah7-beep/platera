#!/usr/bin/env bash
# Scene 3 renders, after the Scene 1 queue has finished.
set -e
cd /c/Users/User/platera
B="/c/Users/User/AppData/Local/Programs/BlenderPortable/blender-5.2.2-windows-x64/blender.exe"
until [ "$(ls assets/render/fall_portrait_mask 2>/dev/null | wc -l)" -ge 150 ]; do sleep 30; done
sleep 20
"$B" -b -P src/pipeline/blender/scene_stamp.py -- --anim --samples 160 > /dev/null 2>&1
"$B" -b -P src/pipeline/blender/scene_stamp.py -- --anim --samples 160 --portrait > /dev/null 2>&1
echo "stamp done: $(ls assets/render/stamp | wc -l) $(ls assets/render/stamp_portrait | wc -l)"
