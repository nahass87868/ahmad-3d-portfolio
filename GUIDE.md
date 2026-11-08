# Phase 3 fix 01: layout and mobile foundation

**What this does:** four small CSS fixes for phones. Nothing changes on desktop, in portrait, or on phones without a notch (the safe-area values are 0 there).

Changed files: `premium.css`, `polish.js` (plus the refreshed `graphify-out/` map).

## Step 1: copy the files in
Unzip `fix01.zip`, copy everything into your clone folder, choose **Replace**. No `npm install` is needed.

## Step 2: check it
```
npm run build
npm run preview
```
`npm run build` must end with **OK** and say **131 files**. Open the preview address and check the site looks and works as before.

## Step 3: commit and push
Summary: `Phase 3 fix 01: layout and mobile foundation` -> **Commit to main** -> **Push origin**. Watch **Actions** for the green tick.

## Step 4: check it on your phone
1. Hold the phone sideways (landscape), open the menu: you can scroll it and reach the last row of links. If your phone has a notch, nothing sits under it.
2. Pull down at the very top of the page: the browser should NOT refresh and replay the intro.
3. Long-press the Grid / Index buttons: the text must not get selected.

## If anything goes wrong
GitHub Desktop -> **History** -> right-click the commit -> **Revert this commit** -> **Push origin**.
