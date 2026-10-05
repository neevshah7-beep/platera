#!/usr/bin/env bash
# Finishes the Scene 1 renders: portrait (resuming), then the ring mattes.
set -e
cd /c/Users/User/platera
B="/c/Users/User/AppData/Local/Programs/BlenderPortable/blender-5.2.2-windows-x64/blender.exe"
n=$(ls assets/render/fall_portrait 2>/dev/null | wc -l)
if [ "$n" -lt 150 ]; then "$B" -b -P src/pipeline/blender/scene_fall.py -- --anim --samples 160 --portrait --start $((n)) > /dev/null 2>&1; fi
"$B" -b -P src/pipeline/blender/scene_fall.py -- --anim --samples 12 --mask > /dev/null 2>&1
"$B" -b -P src/pipeline/blender/scene_fall.py -- --anim --samples 12 --mask --portrait > /dev/null 2>&1
echo "queue done: $(ls assets/render/fall_portrait | wc -l) $(ls assets/render/fall_mask | wc -l) $(ls assets/render/fall_portrait_mask | wc -l)"
