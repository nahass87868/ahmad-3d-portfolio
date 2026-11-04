# Phase 2 guide: modern three.js (no visible change)

**What this does:** the 3D hero now runs on a current three.js (0.186.1, pinned) instead of the 2021 version. It looks the same and behaves the same.
It is the foundation for every later phase (live work planes, turntable, smooth scroll), which all need one modern three.js.
The hero code now lives in `src/hero/`; three.js loads as its own lazy file so it never delays the page.

## Step 1: copy the files in
1. Unzip `phase2.zip` and copy everything inside it into your clone folder (`D:\my prtflio\git-clone\ahmad-3d-portfolio`). Choose **Replace** when asked.
2. **Delete two files** from the clone folder (they are replaced and no longer used):
   - `hero-3d.js` (in the main folder: it moved to `src\hero\hero-3d.js`)
   - `vendor\three.min.js` (the old three.js, 603 KB)

## Step 2: check it on your PC
In Git Bash, in the clone folder:
```
npm install
npm run build
npm run preview
```
- `npm install` downloads three.js (once).
- `npm run build` must end with a line starting **OK** (it should say 167 files).
- `npm run preview` prints an address like `http://localhost:4173/`. Open it: the hero should look exactly as before. Press `Ctrl+C` to stop.

## Step 3: commit and push
GitHub Desktop should show 8 changed files and 2 deleted files. Summary: `Phase 2: modern three.js`. **Commit to main**, then **Push origin**. Watch **Actions** for the green tick.

## Step 4: check the live site
1. `Ctrl+F5`, then in the console (`F12`) type `__BUILD__`: it should show `phase: 2`.
2. Compare the hero with how it looked before: shading, the letters, the ring when you hover.
3. Check your phone. If you can, also try Safari on any Apple device and tell me how the hero looks.

## If anything goes wrong
- **Quickest:** GitHub Desktop → **History** → right-click the Phase 2 commit → **Revert this commit** → **Push origin**. That restores Phase 1.
- **Or:** Settings → Pages → Source: **Deploy from a branch** → `legacy` → `/ (root)`.

## Tuning
All hero numbers are at the top of `src/hero/hero-3d.js`. The lights and exposure are `LIGHT_HEMI`, `LIGHT_KEY`, `LIGHT_RIM` and `EXPOSURE`. They were fitted to match the old look, so scale them together to brighten or darken.
