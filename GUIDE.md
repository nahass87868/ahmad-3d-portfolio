# Phase 1 guide: Vite build + automatic deploy

**What this phase does:** adds a build system and automatic publishing. **Nothing on the site changes.**
Your existing scripts, styles, fonts, images and videos are published byte for byte; the build refuses to finish if any of them differs from its source.

**What changes in your repo:** 8 new files and 1 edited file (`index.html`: one added line). Nothing is deleted or moved.

---

## Step 1: copy the files in
1. Unzip `phase1.zip`.
2. Copy everything inside it into your clone folder: `D:\my prtflio\git-clone\ahmad-3d-portfolio`
3. Windows asks about existing files (`index.html`, and the stray `package-lock.json` from earlier): choose **Replace**.
4. Do not delete anything.

## Step 2: check it on your own PC (about 5 minutes)
1. In that folder, right-click an empty area → **Open Git Bash here**.
2. Run these one at a time:
   ```
   npm install
   npm run build
   npm run preview
   ```
   - `npm install` runs once (about a minute). It creates a `node_modules` folder (about 35 MB). Git ignores it.
   - `npm run build` must end with a line starting **`OK`** (it says how many files were checked as identical). If it says `BUILD FAILED`, stop and send me the message.
   - `npm run preview` prints an address like `http://localhost:4173/`. Open it: it is the exact site that will be published.
3. Press `Ctrl+C` in Git Bash to stop the preview.

## Step 3: switch GitHub Pages to deploy from Actions (do this right before Step 4)
GitHub → your repo → **Settings** → **Pages** → *Build and deployment* → **Source: GitHub Actions**.

## Step 4: commit and push
1. Open **GitHub Desktop**. You should see about 9 changed files (no `node_modules`).
2. Summary: `Phase 1: Vite build and Actions deploy` → **Commit to main** → **Push origin**.
   (A warning about LF/CRLF line endings is harmless.)

## Step 5: watch it publish
1. GitHub → **Actions** tab → the run called **Deploy site**. Yellow dot = running, green tick = published (about 2-4 minutes; the media makes it slower than a normal site).
2. Open `https://nahass87868.github.io/ahmad-3d-portfolio/`, press `Ctrl+F5`.
3. Open the browser console (`F12`) and type `__BUILD__`. You should see `{tool: "vite", phase: 1}`.
4. Check the site once on your phone.

## If anything goes wrong: roll back in about a minute
GitHub → **Settings** → **Pages** → Source: **Deploy from a branch** → branch **`legacy`**, folder **`/ (root)`** → **Save**.
Your previous site is untouched on that branch.
If the Actions run shows a red cross, click it, copy the error text, and send it to me.

## What I need back
- A screenshot of the green Actions run, and a note on whether the phone looks and feels the same.

## Commands reference
| Command | What it does |
|---|---|
| `npm run build` | builds into `dist/` and verifies it |
| `npm run preview` | serves `dist/` exactly as it will be published |
| `npm run dev` | development server for the new modules (used from later phases; it adds source maps, so it is not byte-identical to the published site) |
