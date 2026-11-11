# Phase 3 Fix 04a: reliability + optimization (batches A and B)

**What this does (all small, no new features):**
1. Project image sizes (`IMAGE_SIZES` in `script.js`) now match the real WebP files (all 52 were wrong), so project panels stop shifting while images load.
2. Removed the dead `.jpg` retry for project images and the portrait (the JPGs are never published). A missing file now goes straight to the "Media missing" state, with no wasted request.
3. Hero gets a `100vh` fallback before `100svh` (older Android WebView).
4. The hidden "Skip intro" button leaves the Tab order after the intro.
5. Closing the phone menu returns focus to the Menu button.
6. The 3D chunk (about 758 KB) is no longer downloaded when Data Saver is on or WebGL is missing; the loading curtain is released immediately in that case.

Changed files: `script.js`, `about-photo.js`, `style.css`, `src/main.js`, `polish.js` (also holds Fix 03b), this `GUIDE.md`, and the refreshed `graphify-out/`.

## Step 1: copy the files in
Unzip `fix04a.zip` into your clone folder (the one with `package.json`), choose **Replace** for all. No `npm install` needed.

## Step 2: build and look
Open Git Bash in the folder:
```
npm run build
npm run preview
```
`npm run build` must end with **OK** and say **131 files**. Open the preview address.

## Step 3: check (2 minutes)
- Normal desktop: intro plays, the 3D letters appear as before. Open 3 or 4 projects: images show and the page does not jump while they load.
- Chrome DevTools, Network tab, tick "Disable cache", reload: you should see the `hero-3d` file load.
- Data Saver test (optional): on an Android phone turn on Data Saver in Chrome, reload: the intro must still finish, and no `hero-3d` file is requested in the Network tab.
- Press Tab right after the intro ends: focus must not land on an invisible button at the bottom left.
- Phone width: open Menu, press Escape: focus goes back to the Menu button.

## Step 4: commit and push
GitHub Desktop: summary `Phase 3 Fix 04a: image sizes, fallbacks, 3D gating` -> **Commit to main** -> **Push origin**. Watch **Actions** for the green tick.

## If anything goes wrong
GitHub Desktop -> **History** -> right-click the commit -> **Revert this commit** -> **Push origin**.
