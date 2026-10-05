#!/usr/bin/env bash
# Scene 5 renders, after the stamp renders.
set -e
cd /c/Users/User/platera
B="/c/Users/User/AppData/Local/Programs/BlenderPortable/blender-5.2.2-windows-x64/blender.exe"
until [ "$(ls assets/render/stamp_portrait 2>/dev/null | wc -l)" -ge 72 ]; do sleep 30; done
sleep 30
"$B" -b -P src/pipeline/blender/scene_gift.py -- --anim --samples 128 > /dev/null 2>&1
"$B" -b -P src/pipeline/blender/scene_gift.py -- --anim --samples 128 --portrait > /dev/null 2>&1
echo "gift done: $(ls assets/render/gift | wc -l) $(ls assets/render/gift_portrait | wc -l)"
