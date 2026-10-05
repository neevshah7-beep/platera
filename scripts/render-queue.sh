#!/usr/bin/env bash
# Runs the Scene 1 renders in sequence after the landscape pass finishes.
set -e
cd /c/Users/User/platera
B="/c/Users/User/AppData/Local/Programs/BlenderPortable/blender-5.2.2-windows-x64/blender.exe"
until [ -f assets/render/fall/0150.png ]; do sleep 20; done
sleep 15
"$B" -b -P src/pipeline/blender/scene_fall.py -- --anim --samples 160 --portrait > /dev/null 2>&1
"$B" -b -P src/pipeline/blender/scene_fall.py -- --anim --samples 12 --mask > /dev/null 2>&1
"$B" -b -P src/pipeline/blender/scene_fall.py -- --anim --samples 12 --mask --portrait > /dev/null 2>&1
echo "queue done: $(ls assets/render/fall | wc -l) $(ls assets/render/fall_portrait | wc -l) $(ls assets/render/fall_mask | wc -l) $(ls assets/render/fall_portrait_mask | wc -l)"
