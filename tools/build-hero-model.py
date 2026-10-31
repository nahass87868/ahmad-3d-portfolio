#!/usr/bin/env python3
"""
build-hero-model.py - turns assets-src/portfolio.glb into hero-3d-model.js (the base64 text the 3D hero loads).

Run it whenever you change the model:   python3 tools/build-hero-model.py
Needs Python 3 and numpy (pip install numpy). Nothing else.

Why a build step instead of loading the .glb as-is: hero-3d.js expects exactly 9 meshes in the order
P-O-R-T-F-O-L-I-O, outward-facing, each about the size the collision table (LETTERS in hero-3d.js) was tuned for.
This script makes any export of the model satisfy that, so the layout, positions and rotations never change:
  1. order the 9 meshes left to right by their X position in the file
  2. flip any mesh that came out of Blender inside out (negative signed volume): winding + normals
  3. scale each letter uniformly so its footprint (longest side in the letter plane) equals FOOTPRINT[i]
  4. keep only POSITION, NORMAL and indices (the hero reads nothing else), so UVs / vertex colours are dropped
"""
import base64, json, struct, sys, os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'assets-src', 'portfolio.glb')
OUT = os.path.join(HERE, '..', 'hero-3d-model.js')

LETTERS = 'PORTFOLIO'
# Longest side (x or z) of each letter in the model the layout was tuned with, in the file's own units.
# The collision circles in hero-3d.js LETTERS[...].k are sized for exactly these footprints.
FOOTPRINT = [0.509, 0.527, 0.509, 0.509, 0.509, 0.527, 0.509, 0.509, 0.527]

TY = {5126: np.float32, 5123: np.uint16, 5125: np.uint32}
N = {'SCALAR': 1, 'VEC3': 3}


def read_glb(path):
    buf = open(path, 'rb').read()
    jl = struct.unpack_from('<I', buf, 12)[0]
    j = json.loads(buf[20:20 + jl])
    bl = struct.unpack_from('<I', buf, 20 + jl)[0]
    b = buf[20 + jl + 8: 20 + jl + 8 + bl]
    return j, b


def accessor(j, b, i):
    a = j['accessors'][i]
    v = j['bufferViews'][a['bufferView']]
    dt, n = TY[a['componentType']], N[a['type']]
    if v.get('byteStride') not in (None, n * np.dtype(dt).itemsize):
        raise SystemExit('interleaved buffers are not supported: export without them')
    off = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    arr = np.frombuffer(b, dtype=dt, count=a['count'] * n, offset=off)
    return arr.reshape(a['count'], n) if n > 1 else arr


def pad4(data, fill=b'\0'):
    return data + fill * (-len(data) % 4)


def main():
    j, b = read_glb(SRC)
    if len(j['nodes']) != 9:
        raise SystemExit('expected 9 meshes, found %d' % len(j['nodes']))
    order = sorted(range(9), key=lambda i: j['nodes'][i].get('translation', [0, 0, 0])[0])  # left to right
    parts, report = [], []
    for slot, ni in enumerate(order):
        node = j['nodes'][ni]
        prim = j['meshes'][node['mesh']]['primitives'][0]
        pos = accessor(j, b, prim['attributes']['POSITION']).astype(np.float64)
        nor = accessor(j, b, prim['attributes']['NORMAL']).astype(np.float64)
        idx = accessor(j, b, prim['indices']).astype(np.uint32).reshape(-1, 3)
        tri = pos[idx]
        volume = np.einsum('ij,ij->i', tri[:, 0], np.cross(tri[:, 1], tri[:, 2])).sum() / 6
        flipped = volume < 0
        if flipped:  # inside out: reverse the winding and point the normals outward
            idx = idx[:, [0, 2, 1]]
            nor = -nor
        lo, hi = pos.min(0), pos.max(0)
        pos = pos - (lo + hi) / 2
        ext = hi - lo
        k = FOOTPRINT[slot] / max(ext[0], ext[2])  # uniform, so normals stay valid
        pos = pos * k
        nor = nor / np.maximum(np.linalg.norm(nor, axis=1, keepdims=True), 1e-12)
        parts.append((LETTERS[slot], pos.astype(np.float32), nor.astype(np.float32), idx.astype(np.uint16).reshape(-1)))
        report.append('%s <- %-10s tris %4d  scale %.3f%s' % (LETTERS[slot], node.get('name'), len(idx), k, '  (was inside out, flipped)' if flipped else ''))

    binary, views, accessors, nodes, meshes = b'', [], [], [], []
    for m, (name, pos, nor, idx) in enumerate(parts):
        base = len(accessors)
        for arr, comp, typ, target in ((pos, 5126, 'VEC3', 34962), (nor, 5126, 'VEC3', 34962), (idx, 5123, 'SCALAR', 34963)):
            raw = pad4(arr.tobytes())
            views.append({'buffer': 0, 'byteOffset': len(binary), 'byteLength': arr.nbytes, 'target': target})
            acc = {'bufferView': len(views) - 1, 'componentType': comp, 'count': len(arr), 'type': typ}
            if arr is pos:
                acc['min'] = [float(x) for x in pos.min(0)]
                acc['max'] = [float(x) for x in pos.max(0)]
            accessors.append(acc)
            binary += raw
        meshes.append({'name': name, 'primitives': [{'attributes': {'POSITION': base, 'NORMAL': base + 1}, 'indices': base + 2}]})
        nodes.append({'name': name, 'mesh': m})
    doc = {'asset': {'version': '2.0', 'generator': 'build-hero-model.py'}, 'scene': 0, 'scenes': [{'nodes': list(range(9))}],
           'nodes': nodes, 'meshes': meshes, 'accessors': accessors, 'bufferViews': views, 'buffers': [{'byteLength': len(binary)}]}
    js = pad4(json.dumps(doc, separators=(',', ':')).encode(), b' ')
    glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binary)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(binary), 0x004E4942) + binary
    text = '/* portfolio.glb as base64 text (works from file:// too). Generated by tools/build-hero-model.py - do not edit by hand. */\nwindow.__HERO3D_GLB__="' + base64.b64encode(glb).decode() + '";\n'
    open(OUT, 'w').write(text)
    print('\n'.join(report))
    print('glb %d bytes -> %s (%d bytes of text)' % (len(glb), os.path.basename(OUT), len(text)))


if __name__ == '__main__':
    main()
