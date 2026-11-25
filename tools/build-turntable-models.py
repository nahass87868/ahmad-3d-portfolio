#!/usr/bin/env python3
"""
build-turntable-models.py - turns source/<name>.glb into models/<name>.glb, the small file the project-panel turntable loads.

Run it whenever a source model changes:   python3 tools/build-turntable-models.py [name ...]
Needs Python 3 and numpy (pip install numpy). Nothing else. The output is deterministic: running it twice gives identical bytes.

Why a build step instead of publishing the source files: they are 0.2 to 9.7 MB each (textures, up to 20 materials, up to 209k
triangles) and the turntable shows solid / clay / wire only. Each output keeps the geometry and nothing else:
  1. every mesh of the default scene is baked into world space (node transforms applied) and merged into ONE mesh
  2. only POSITION, NORMAL and the triangle indices are kept (UVs and textures are dropped); vertices that became identical once the
     UVs were gone are welded. COLOR_0 is added only if the model has real colours: material base colour x vertex colour, no textures.
     A model whose triangles are all flat-shaded (their normals are the face normals) loses NORMAL too: glTF then means flat shading
     and the vertices can be shared by position, which more than halves such a file
  3. centred on the middle of its bounding box and scaled so its bounding sphere has radius 1 (one camera distance fits every model)
  4. quantised (KHR_mesh_quantization): positions int16 and normals int8, both normalised, so the file is about 40% smaller than float32.
     Error: at most 1.5e-5 of the radius for positions, about 0.4 degrees for normals. Colours are 8-bit.
  5. the triangle count is unchanged (checked). Nothing is decimated here.
The result is a valid glTF 2.0 binary (opens in Blender or any viewer that supports KHR_mesh_quantization). Radius 1, Y up, as in the source.
"""
import json, struct, sys, os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'source')
OUT = os.path.join(HERE, '..', 'models')
MODELS = ['nike-shoe', 'yerba-mate', 'youth-affairs', 'date-cookies']  # file names without .glb; works.js `model` uses the same names

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def read_glb(path):
    buf = open(path, 'rb').read()
    magic, version = struct.unpack_from('<4sI', buf, 0)
    if magic != b'glTF' or version != 2:
        raise SystemExit(f'{path}: not a glTF 2.0 binary')
    jl = struct.unpack_from('<I', buf, 12)[0]
    j = json.loads(buf[20:20 + jl])
    bl = struct.unpack_from('<I', buf, 20 + jl)[0]
    if set(j.get('extensionsRequired', [])) & {'KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_mesh_quantization'}:
        raise SystemExit(f'{path}: compressed or quantized geometry is not supported')
    return j, buf[20 + jl + 8: 20 + jl + 8 + bl]


def accessor(j, b, i):
    a = j['accessors'][i]
    if 'sparse' in a:
        raise SystemExit('sparse accessors are not supported')
    v = j['bufferViews'][a['bufferView']]
    dt, n = np.dtype(CT[a['componentType']]), NC[a['type']]
    o = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = v.get('byteStride') or n * dt.itemsize
    if stride == n * dt.itemsize:
        return np.frombuffer(b, dtype=dt, count=a['count'] * n, offset=o).reshape(a['count'], n)
    raw = np.lib.stride_tricks.as_strided(np.frombuffer(b, dtype=np.uint8, offset=o), shape=(a['count'], n * dt.itemsize), strides=(stride, 1))
    return np.ascontiguousarray(raw).view(dt).reshape(a['count'], n)


def local_matrix(nd):
    if 'matrix' in nd:
        return np.array(nd['matrix'], dtype=np.float64).reshape(4, 4).T
    x, y, z, w = nd.get('rotation', [0, 0, 0, 1])
    R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                  [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                  [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    M = np.eye(4)
    M[:3, :3] = R * np.array(nd.get('scale', [1, 1, 1]), dtype=np.float64)
    M[:3, 3] = nd.get('translation', [0, 0, 0])
    return M


def instances(j, ni, parent, out):  # (node index, world matrix) for every node under ni, in file order
    M = parent @ local_matrix(j['nodes'][ni])
    out.append((ni, M))
    for c in j['nodes'][ni].get('children', []):
        instances(j, c, M, out)


def convert(name):
    j, b = read_glb(os.path.join(SRC, name + '.glb'))
    nodes = []
    for r in j['scenes'][j.get('scene', 0)]['nodes']:
        instances(j, r, np.eye(4), nodes)
    P, N, C, I, want, base = [], [], [], [], 0, 0
    for ni, M in nodes:
        if 'mesh' not in j['nodes'][ni]:
            continue
        M3 = M[:3, :3]
        for pr in j['meshes'][j['nodes'][ni]['mesh']]['primitives']:
            at = pr['attributes']
            if pr.get('mode', 4) != 4 or 'POSITION' not in at or 'NORMAL' not in at:
                raise SystemExit(f'{name}: every primitive needs triangles with POSITION and NORMAL')
            p = accessor(j, b, at['POSITION']).astype(np.float64)
            n = accessor(j, b, at['NORMAL']).astype(np.float64)
            idx = accessor(j, b, pr['indices']).reshape(-1).astype(np.int64) if 'indices' in pr else np.arange(len(p))
            tri = idx.reshape(-1, 3)
            want += len(tri)
            pw = p @ M3.T + M[:3, 3]
            nw = n @ np.linalg.inv(M3)  # inverse transpose, as row vectors
            nw /= np.maximum(np.linalg.norm(nw, axis=1, keepdims=True), 1e-12)
            if np.linalg.det(M3) < 0:  # a mirroring node turns the triangles inside out: restore the winding
                tri = tri[:, [0, 2, 1]]
            a, bb, c = pw[tri[:, 0]], pw[tri[:, 1]], pw[tri[:, 2]]
            agree = (np.einsum('ij,ij->i', np.cross(bb - a, c - a), nw[tri[:, 0]] + nw[tri[:, 1]] + nw[tri[:, 2]]) > 0).mean()
            if agree < 0.5:
                raise SystemExit(f'{name}: a mesh is inside out (winding disagrees with its normals); fix it in the source file')
            col = np.array(((j['materials'][pr['material']].get('pbrMetallicRoughness', {}).get('baseColorFactor') or [1, 1, 1])[:3]) if 'material' in pr else [1, 1, 1], dtype=np.float64)
            vc = np.ones((len(p), 3))
            if 'COLOR_0' in at:
                cv = accessor(j, b, at['COLOR_0'])[:, :3]
                vc = cv.astype(np.float64) / (np.iinfo(cv.dtype).max if cv.dtype.kind == 'u' else 1)
            P.append(pw); N.append(nw); C.append(np.rint(np.clip(col * vc, 0, 1) * 255).astype(np.uint8)); I.append(tri + base); base += len(p)
    P, N, C, I = np.vstack(P), np.vstack(N), np.vstack(C), np.vstack(I)
    used, idx = np.unique(I.reshape(-1), return_inverse=True)  # drop vertices no triangle uses
    P, N, C = P[used], N[used], C[used]
    verts_before = len(P)
    # centre on the bounding box and scale to a bounding sphere of radius 1 (source = p * radius + centre)
    centre = (P.min(axis=0) + P.max(axis=0)) / 2
    radius = np.linalg.norm(P - centre, axis=1).max()
    P = (P - centre) / radius
    # flat-shaded? every vertex normal of a triangle equals its face normal (degenerate triangles do not count)
    t = idx.reshape(-1, 3)
    fn = np.cross(P[t[:, 1]] - P[t[:, 0]], P[t[:, 2]] - P[t[:, 0]])
    ln = np.linalg.norm(fn, axis=1)
    ok = ln > 1e-12
    fn[ok] /= ln[ok, None]
    same = np.ones(len(t), bool)
    for k in range(3):
        same &= (np.einsum('ij,ij->i', fn, N[t[:, k]]) > 0.9998) | ~ok
    is_flat = same.mean() >= 0.99
    # quantise, then weld the vertices that are identical once the UVs are gone
    Pq = np.clip(np.rint(P * 32767), -32767, 32767).astype(np.int16)
    Nq = None if is_flat else np.clip(np.rint(N * 127), -127, 127).astype(np.int8)
    colour = bool((C != 255).any())
    rows = np.hstack([Pq.astype(np.int32)] + ([] if is_flat else [Nq.astype(np.int32)]) + ([C.astype(np.int32)] if colour else []))
    _, first, inv = np.unique(rows, axis=0, return_index=True, return_inverse=True)
    order = np.argsort(first, kind='stable')  # keep the order in which vertices first appear
    rank = np.empty(len(order), np.int64)
    rank[order] = np.arange(len(order))
    keep = first[order]
    Pq, C = Pq[keep], C[keep]
    Nq = None if is_flat else Nq[keep]
    idx = rank[inv.reshape(-1)][idx]
    if len(idx) // 3 != want:
        raise SystemExit(f'{name}: triangle count changed ({want} -> {len(idx) // 3})')
    return Pq, Nq, (C if colour else None), idx.astype(np.uint16 if len(Pq) < 65536 else np.uint32), dict(source=f'source/{name}.glb', radius=float(radius), centre=[float(x) for x in centre]), verts_before


def write_glb(path, Pq, Nq, C, I, extras):
    parts, views, accs, attrs = [], [], [], {}

    def add(arr, target, stride=None, **acc):
        data = arr.tobytes()
        view = {'buffer': 0, 'byteOffset': sum(len(x) for x in parts), 'byteLength': len(data), 'target': target}
        if stride:
            view['byteStride'] = stride
        views.append(view)
        accs.append(dict(bufferView=len(views) - 1, **acc))
        parts.append(data + b'\0' * (-len(data) % 4))
        return len(accs) - 1

    pad = lambda a: np.hstack([a, np.zeros((len(a), 1), a.dtype)])  # 3 components -> 4 so every vertex starts on a 4-byte boundary
    attrs['POSITION'] = add(pad(Pq), 34962, 8, componentType=5122, normalized=True, count=len(Pq), type='VEC3', min=[int(x) for x in Pq.min(axis=0)], max=[int(x) for x in Pq.max(axis=0)])
    if Nq is not None:
        attrs['NORMAL'] = add(pad(Nq), 34962, 4, componentType=5120, normalized=True, count=len(Nq), type='VEC3')
    if C is not None:
        attrs['COLOR_0'] = add(np.hstack([C, np.full((len(C), 1), 255, np.uint8)]), 34962, componentType=5121, normalized=True, count=len(C), type='VEC4')
    ii = add(I, 34963, componentType=5123 if I.dtype == np.uint16 else 5125, count=len(I), type='SCALAR')
    binary = b''.join(parts)
    name = os.path.splitext(os.path.basename(path))[0]
    js = json.dumps({'asset': {'version': '2.0', 'generator': 'tools/build-turntable-models.py', 'extras': extras},
                     'extensionsUsed': ['KHR_mesh_quantization'], 'extensionsRequired': ['KHR_mesh_quantization'],
                     'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'name': name, 'mesh': 0}],
                     'meshes': [{'name': name, 'primitives': [{'attributes': attrs, 'indices': ii, 'mode': 4}]}],
                     'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(binary)}]}, separators=(',', ':')).encode()
    js += b' ' * (-len(js) % 4)
    with open(path, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(binary)))
        f.write(struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(binary), 0x004E4942) + binary)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    print(f'{"model":<15}{"source":>9}{"triangles":>11}{"vertices":>16}{"output":>9}  normals  colours')
    for name in sys.argv[1:] or MODELS:
        Pq, Nq, C, I, ex, before = convert(name)
        out = os.path.join(OUT, name + '.glb')
        write_glb(out, Pq, Nq, C, I, ex)
        print(f'{name:<15}{os.path.getsize(os.path.join(SRC, name + ".glb")) // 1024:>6} KB{len(I) // 3:>11}{before:>8} ->{len(Pq):>5}{os.path.getsize(out) // 1024:>6} KB  {"yes" if Nq is not None else "flat":<7}  {"yes" if C is not None else "no"}')
