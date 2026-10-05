#!/usr/bin/env bash
# Renders every outstanding scene sequence, resuming where each left off. Safe to re-run.
# Launch detached (no task time limit):
#   powershell Start-Process bash -ArgumentList 'scripts/render-all.sh' -WindowStyle Hidden
cd /c/Users/User/platera
B="/c/Users/User/AppData/Local/Programs/BlenderPortable/blender-5.2.2-windows-x64/blender.exe"
LOG=assets/render/render-all.log
mkdir -p assets/render
# Never run two renders at once: wait for any Blender already rendering to finish.
while tasklist 2>/dev/null | grep -qi "^blender.exe"; do sleep 20; done
run() { # scene dir frames args...
  local script=$1 dir=$2 frames=$3; shift 3
  local n
  n=$(ls "assets/render/$dir" 2>/dev/null | grep -c '\.png$')
  if [ "$n" -ge "$frames" ]; then echo "$(date +%T) $dir complete ($n)" >> $LOG; return; fi
  echo "$(date +%T) $dir from frame $((n > 0 ? n : 1))" >> $LOG
  "$B" -b -P "src/pipeline/blender/$script" -- --anim "$@" --start $((n > 0 ? n : 1)) > /dev/null 2>&1
  echo "$(date +%T) $dir done: $(ls assets/render/$dir | grep -c '\.png$')" >> $LOG
}
run scene_fall.py fall_portrait 150 --samples 160 --portrait
run scene_fall.py fall_mask 150 --samples 12 --mask
run scene_fall.py fall_portrait_mask 150 --samples 12 --mask --portrait
run scene_stamp.py stamp 72 --samples 160
run scene_stamp.py stamp_portrait 72 --samples 160 --portrait
run scene_gift.py gift 200 --samples 128
run scene_gift.py gift_portrait 200 --samples 128 --portrait
echo "$(date +%T) ALL DONE" >> $LOG
