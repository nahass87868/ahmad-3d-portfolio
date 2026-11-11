# Phase 3 Fix 04b: stop the loading-curtain name from jumping (CLS)

**What this does:** one CSS line in `premium.css`. Your trace showed the curtain name (`.pname`) growing from 2 lines to 3 and back at about 1.95 s and 2.2 s (two shifts of 0.36 each, about 0.72 of the 0.98 total). Cause: the letters start wide (width 125), a word wraps onto an extra line, then the letters condense and it unwraps. `white-space: nowrap` keeps each word on one line. The curtain clips anything past the screen edge, so nothing else changes.

Changed files: `premium.css`, `GUIDE.md`, refreshed `graphify-out/`.

## Step 1: copy the files in
Unzip `fix04b.zip` into your clone folder (the one with `package.json`), choose **Replace**.

## Step 2: build and look
```
npm run build
npm run preview
```
`npm run build` must end with **OK** and say **131 files**. Open the preview and reload a few times: the big name in the loading curtain should rise letter by letter on one line per word, with no jump.

## Step 3: measure
In Chrome DevTools, Performance tab, record a page reload again. In the **Layout shifts** row, the two big `div.pname` shifts should be gone (CLS should drop from about 0.98 to about 0.26).

## Step 4: commit and push
GitHub Desktop: summary `Phase 3 Fix 04b: curtain name no-wrap` -> **Commit to main** -> **Push origin**.

## If anything goes wrong
GitHub Desktop -> **History** -> right-click the commit -> **Revert this commit** -> **Push origin**.
