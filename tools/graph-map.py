#!/usr/bin/env python3
"""
tools/graph-map.py - rebuilds the project map in graphify-out/ (free: no model tokens, no network).
Run from the repo root:   python3 tools/graph-map.py        (needs:  pip install graphifyy)

Writes:  graphify-out/graph.json   the knowledge graph (code structure, script load order, window.* contracts)
         graphify-out/GRAPH_REPORT.md   communities, god nodes, surprises
         graphify-out/graph.html        interactive view
         graphify-out/PROJECT_MAP.md    cheat sheet: files, load order, globals, project table, assets, tunables

Why it exists: so a session can ask the graph / read PROJECT_MAP.md instead of re-reading every file.
Binaries (images, videos, models, fonts, vendor libraries) are never graphed; PROJECT_MAP.md inventories them instead.
"""
import json, re, os, sys, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
OUT = Path('graphify-out'); OUT.mkdir(exist_ok=True)
SKIP_DIRS = {'node_modules', 'dist', '.build', '.git', 'images', 'videos', 'models-src', 'assets-src', 'vendor', 'fonts', 'graphify-out', '.vite'}
SKIP_FILES = {'hero-3d-model.js', 'package-lock.json'}
CODE_EXT = {'.js', '.mjs', '.py', '.json', '.yml', '.yaml'}

def walk():
    for d, ds, fs in os.walk('.'):
        ds[:] = sorted(x for x in ds if x not in SKIP_DIRS)
        for f in sorted(fs):
            p = (Path(d) / f).as_posix()
            yield p[2:] if p.startswith('./') else p
files = [p for p in walk() if p not in SKIP_FILES]
code = [Path(p) for p in files if Path(p).suffix in CODE_EXT]
JS = [p for p in files if p.endswith(('.js', '.mjs')) and p != 'vite.config.js']

from graphify.extract import extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json

res = extract(code, cache_root=ROOT, root=ROOT)
nodes, edges = res['nodes'], res['edges']
ids = {n['id'] for n in nodes}
file_node = {}
for n in nodes:
    if n.get('source_file') and n['label'] == Path(n['source_file']).name: file_node[n['source_file']] = n['id']
def slug(s): return re.sub(r'[^a-z0-9]+', '_', s.lower()).strip('_')
def add_node(i, label, ftype, src, loc=None):
    if i in ids: return
    ids.add(i); nodes.append({'id': i, 'label': label, 'file_type': ftype, 'source_file': src, 'source_location': loc or 'L1', '_origin': 'ast'})
def add_edge(a, b, rel, src, loc, conf='EXTRACTED'):
    edges.append({'source': a, 'target': b, 'relation': rel, 'confidence': conf, 'source_file': src, 'source_location': loc, 'weight': 1.0, '_origin': 'ast'})
def fnode(path):
    if path not in file_node:
        i = 'file_' + slug(path); add_node(i, Path(path).name, 'document', path); file_node[path] = i
    return file_node[path]
for p in files:
    if Path(p).suffix in ('.css', '.html', '.md'): fnode(p)

# 1) functions the AST pass skipped (nested helpers, arrow-function consts): found by a plain text scan of each JS file
have = collections.defaultdict(set)
for n in nodes: have[n.get('source_file')].add(n['label'].strip('()').split('.')[-1])
FN = [re.compile(r"^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\("), re.compile(r"^\s*(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>")]
added = 0
for p in JS:
    for i, line in enumerate(open(p, encoding='utf8').read().split('\n'), 1):
        for rx in FN:
            m = rx.match(line)
            if m and m.group(1) not in have[p]:
                nid = f'{slug(p)}_{slug(m.group(1))}_outline'; add_node(nid, m.group(1) + '()', 'code', p, f'L{i}'); add_edge(fnode(p), nid, 'contains', p, f'L{i}'); have[p].add(m.group(1)); added += 1
# 2) index.html: what loads what, in order (a blocking script runs before the deferred ones; module scripts run after)
html = open('index.html', encoding='utf8').read().split('\n'); order = 0
for i, line in enumerate(html, 1):
    m = re.search(r'<script[^>]*\ssrc="([^"]+)"([^>]*)>', line) or re.search(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"', line)
    if not m: continue
    order += 1; tgt = m.group(1); attrs = (m.group(2) if m.lastindex and m.lastindex >= 2 else '')
    kind = 'module' if 'type="module"' in line else 'defer' if 'defer' in line else 'stylesheet' if 'stylesheet' in line else 'blocking'
    edges.append({'source': fnode('index.html'), 'target': fnode(tgt), 'relation': 'loads', 'confidence': 'EXTRACTED', 'source_file': 'index.html', 'source_location': f'L{i}', 'weight': 1.0, '_origin': 'ast', 'order': order, 'kind': kind})
# 3) window.* contracts between scripts: who sets and who reads each global
W = collections.defaultdict(lambda: {'set': set(), 'read': set()})
for p in JS:
    for i, line in enumerate(open(p, encoding='utf8').read().split('\n'), 1):
        for g in re.findall(r'window\.(__[A-Za-z0-9_]+)', line):
            W[g]['set' if re.search(r'window\.' + g + r'\s*=(?!=)', line) else 'read'].add((p, i))
for g, d in sorted(W.items()):
    gid = 'window_' + slug(g); add_node(gid, 'window.' + g, 'concept', sorted(d['set'] or d['read'])[0][0], f'L{sorted(d["set"] or d["read"])[0][1]}')
    for rel, key in (('sets', 'set'), ('reads', 'read')):
        for p, i in sorted(d[key]): add_edge(fnode(p), gid, rel, p, f'L{i}')

ext = {'nodes': nodes, 'edges': edges, 'hyperedges': [], 'input_tokens': 0, 'output_tokens': 0}
G = build_from_json(ext, root=str(ROOT), directed=False)
comm = cluster(G); coh = score_all(G, comm)
def label(c):
    cnt = collections.Counter(G.nodes[n].get('source_file', '?') for n in comm[c]); top = [f for f, _ in cnt.most_common(2)]
    return ' + '.join(Path(f).name for f in top)
labels = {c: label(c) for c in comm}
gods, surp = god_nodes(G), surprising_connections(G, comm)
q = suggest_questions(G, comm, labels)
det = {'total_files': len(code) + 3, 'total_words': 0, 'files': {'code': [str(c) for c in code], 'document': [], 'paper': [], 'image': [], 'video': []}, 'scan_root': str(ROOT)}
to_json(G, comm, str(OUT / 'graph.json'), community_labels=labels)
(OUT / 'GRAPH_REPORT.md').write_text(generate(G, comm, coh, labels, gods, surp, det, {'input': 0, 'output': 0}, str(ROOT), suggested_questions=q), encoding='utf-8')
try:
    from graphify.export import to_html; to_html(G, comm, str(OUT / 'graph.html'), community_labels=labels)
except Exception as e:
    print('graph.html skipped:', e)
print(f'graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(comm)} communities | +{added} functions from the text scan | {len(W)} window.* globals')

# ---- PROJECT_MAP.md: the cheat sheet -------------------------------------------------------------
def size(p): return os.path.getsize(p)
def mb(n): return f'{n/1e6:.1f} MB' if n > 1e6 else f'{n/1e3:.0f} KB'
M = ['# PROJECT MAP (generated by tools/graph-map.py: do not edit by hand)', '',
     'Read this first, then query `graphify-out/graph.json` (nodes carry file + line), and open a file only for the part you need.', '']
M += ['## Files (text sources)', '', '| file | size | lines |', '|---|---|---|']
for p in files:
    if Path(p).suffix in ('.js', '.mjs', '.css', '.html', '.py', '.json', '.yml', '.md'): M.append(f'| `{p}` | {mb(size(p))} | {sum(1 for _ in open(p, encoding="utf8", errors="replace"))} |')
M += ['', '## Published site = these files copied unchanged + the Vite layer (`tools/build-site.mjs`)', '',
      'Published folders (copied byte for byte, never graphed): ' + ', '.join(f'`{d}/` ({sum(len(fs) for _, _, fs in os.walk(d))} files, {mb(sum(size(os.path.join(a, f)) for a, _, fs in os.walk(d) for f in fs))})' for d in ('images', 'videos', 'fonts', 'vendor') if os.path.isdir(d)),
      'Never published: `tools/`, `models-src/`, `assets-src/`, `.github/`, `node_modules/`, `graphify-out/`.', '']
M += ['## Load order in index.html (blocking runs first; defer in order; module last; all before DOMContentLoaded)', '']
for e in sorted([e for e in edges if e['relation'] == 'loads'], key=lambda e: e['order']): M.append(f"{e['order']}. `{[k for k, v in file_node.items() if v == e['target']][0]}`  ({e['kind']})")
M += ['', '## window.* globals between scripts (a curtain/hero bug hid here once: check before changing any of these)', '', '| global | set in | read in |', '|---|---|---|']
for g, d in sorted(W.items()): M.append(f"| `window.{g}` | {', '.join(sorted({f'{p}:{i}' for p, i in d['set']})) or '-'} | {', '.join(sorted({f'{p}:{i}' for p, i in d['read']})) or '-'} |")
# project table
sj = open('script.js', encoding='utf8').read(); works = sj[sj.index('const WORKS = ['):sj.index('const PRIVACY')]
bd = set(os.listdir('images/projects-breakdown')) if os.path.isdir('images/projects-breakdown') else set()
mods = sorted(os.listdir('models-src')) if os.path.isdir('models-src') else []
ALIAS = {'2026-looks.glb': '2026-modes-looks'}  # model files whose names do not contain the slug (confirmed by the owner's naming)
M += ['', '## Projects (source of truth: `WORKS` in script.js)', '', '| # | slug | title | category | images | videos | breakdown trio | model in models-src (name match) |', '|---|---|---|---|---|---|---|---|']
for k, b in enumerate([x for x in re.split(r"(?=slug: ')", works) if x.startswith("slug: '")], 1):
    s = re.match(r"slug: '([^']+)'", b).group(1); g = lambda r: (re.search(r, b) or [None, '?'])[1]
    ni = len(re.findall(r"'[^']+'", (re.search(r"images: \[(.*?)\]", b, re.S) or [0, ''])[1])); nv = len(re.findall(r"'[^']+'", (re.search(r"videos: \[(.*?)\]", b, re.S) or [0, ''])[1]))
    trio = all(f'{s}-image-{x}.webp' in bd for x in ('wire', 'clay', 'final')); mod = [m for m in mods if m[:-4] in s or s in m or ALIAS.get(m) == s]
    M.append(f"| {k} | `{s}` | {g(r'title: .([^\']+).')} | {g(r'category: .([^\']+).')} | {ni} | {nv} | {'yes' if trio else '-'} | {', '.join(mod) or '-'} |")
M += ['', 'Model file names do not equal slugs (e.g. `asus.glb`): the match above is by containment; confirm before relying on it.', '']
# tunables
M += ['## Tunables (top of each module)', '']
for p in ('src/hero/hero-3d.js', 'script.js', 'extras.js', 'polish.js', 'premium.js'):
    t = re.search(r"(?:const|let) (?:T|MOTION|TUNE|POLISH|EXTRAS|PREMIUM)\s*=\s*\{(.*?)\n\s*\};", open(p, encoding='utf8').read(), re.S)
    if t: M.append(f"- `{p}`: " + ', '.join(sorted(set(re.findall(r"\n\s+([A-Z][A-Z0-9_]+):", t.group(0))))[:40]))
M += ['', '## Build', '', '`npm run build` -> `tools/build-site.mjs`: Vite builds `src/main.js` (+ lazy chunks, e.g. three.js) into `.build/modules`; the legacy files are copied to `dist/` and verified byte-identical; `.github/workflows/deploy.yml` publishes `dist/` to GitHub Pages on push to main.',
      'Rollback options: Pages source -> branch `legacy`; or GitHub Desktop: History -> Revert this commit.']
(OUT / 'PROJECT_MAP.md').write_text('\n'.join(M) + '\n', encoding='utf-8'); print('wrote graphify-out/PROJECT_MAP.md')
