"""Proposes which photos show the same piece: SIFT features on each crop, ratio-tested
matches, RANSAC homography inliers between every pair; pairs above a threshold are joined.
python scripts/data/group_by_match.py <crop_dir> <out.json> [min_inliers]
Writes {"groups": [[i, ...], ...], "pairs": {"i-j": inliers}} for review."""
import glob, json, os, sys
import cv2
import numpy as np

d, out = sys.argv[1], sys.argv[2]
MIN = int(sys.argv[3]) if len(sys.argv) > 3 else 22
fs = sorted(glob.glob(os.path.join(d, '*.jpg')))
sift = cv2.SIFT_create(nfeatures=900)
feats = []
for f in fs:
    g = cv2.cvtColor(cv2.imread(f), cv2.COLOR_BGR2GRAY)
    g = cv2.resize(g, (480, 480))
    # Only the upper part: the lower part is mostly the ring's reflection.
    mask = np.zeros_like(g); mask[:340] = 255
    feats.append(sift.detectAndCompute(g, mask))
bf = cv2.BFMatcher()
pairs = {}
n = len(fs)
parent = list(range(n))
def find(a):
    while parent[a] != a:
        parent[a] = parent[parent[a]]; a = parent[a]
    return a
for i in range(n):
    ki, di = feats[i]
    if di is None or len(ki) < 8: continue
    for j in range(i + 1, n):
        kj, dj = feats[j]
        if dj is None or len(kj) < 8: continue
        good = [m for m, nn in (p for p in bf.knnMatch(di, dj, k=2) if len(p) == 2) if m.distance < 0.75 * nn.distance]
        if len(good) < 10: continue
        a = np.float32([ki[m.queryIdx].pt for m in good]); b = np.float32([kj[m.trainIdx].pt for m in good])
        H, inl = cv2.findHomography(a, b, cv2.RANSAC, 6.0)
        c = int(inl.sum()) if inl is not None else 0
        if c >= 12: pairs[f'{i}-{j}'] = c
        if c >= MIN: parent[find(i)] = find(j)
    print(i, flush=True, end=' ')
groups = {}
for i in range(n): groups.setdefault(find(i), []).append(i)
gs = sorted(groups.values(), key=lambda g: g[0])
json.dump({'groups': gs, 'pairs': pairs}, open(out, 'w'))
print('\n', len(gs), 'groups;', sum(len(g) > 1 for g in gs), 'with more than one photo')
